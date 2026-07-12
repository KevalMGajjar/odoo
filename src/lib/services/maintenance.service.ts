import { prisma } from "@/lib/db";
import { Prisma, MaintenanceStatus, VehicleStatus } from "@prisma/client";
import { conflict, notFound } from "@/lib/api/errors";
import { recordAudit } from "./audit";
import type { MaintenanceCreateInput } from "@/lib/validation/maintenance";

const include = {
  vehicle: { select: { id: true, registrationNo: true, name: true, status: true } },
} satisfies Prisma.MaintenanceLogInclude;

export function listMaintenance(filters: { status?: MaintenanceStatus } = {}) {
  return prisma.maintenanceLog.findMany({
    where: filters.status ? { status: filters.status } : undefined,
    include,
    orderBy: { openedAt: "desc" },
  });
}

/**
 * Open a maintenance record. Rule: this moves the vehicle to IN_SHOP, removing it
 * from the dispatch pool. A vehicle on a trip must finish first; retired vehicles
 * are not serviced.
 */
export async function openMaintenance(input: MaintenanceCreateInput, actorId?: string | null) {
  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: input.vehicleId } });
    if (!vehicle) throw notFound("Vehicle not found");
    if (vehicle.status === VehicleStatus.ON_TRIP) {
      throw conflict(`${vehicle.registrationNo} is on a trip. Complete the trip before servicing it.`);
    }
    if (vehicle.status === VehicleStatus.RETIRED) {
      throw conflict(`${vehicle.registrationNo} is retired and cannot be serviced.`);
    }

    const log = await tx.maintenanceLog.create({
      data: {
        vehicleId: input.vehicleId,
        type: input.type,
        description: input.description,
        cost: input.cost ?? 0,
        odometerKm: input.odometerKm,
        status: MaintenanceStatus.OPEN,
      },
      include,
    });

    await tx.vehicle.update({
      where: { id: input.vehicleId },
      data: { status: VehicleStatus.IN_SHOP },
    });

    await recordAudit(tx, {
      entity: "Vehicle",
      entityId: vehicle.id,
      action: "MAINTENANCE_OPEN",
      summary: `${vehicle.registrationNo} sent to shop: ${input.description}`,
      actorId,
    });
    return log;
  });
}

/**
 * Close a maintenance record. Restores the vehicle to AVAILABLE only if it has no
 * other open jobs and is not retired.
 */
export async function closeMaintenance(id: string, actorId?: string | null) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.findUnique({ where: { id }, include });
    if (!log) throw notFound("Maintenance record not found");
    if (log.status === MaintenanceStatus.CLOSED) {
      throw conflict("This maintenance record is already closed.");
    }

    const closed = await tx.maintenanceLog.update({
      where: { id },
      data: { status: MaintenanceStatus.CLOSED, closedAt: new Date() },
      include,
    });

    const otherOpen = await tx.maintenanceLog.count({
      where: { vehicleId: log.vehicleId, status: MaintenanceStatus.OPEN },
    });

    if (otherOpen === 0 && log.vehicle.status !== VehicleStatus.RETIRED) {
      await tx.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      });
    }

    await recordAudit(tx, {
      entity: "Vehicle",
      entityId: log.vehicleId,
      action: "MAINTENANCE_CLOSE",
      summary: `${log.vehicle.registrationNo} service closed: ${log.description}`,
      actorId,
    });
    return closed;
  });
}
