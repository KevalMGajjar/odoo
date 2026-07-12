import { prisma } from "@/lib/db";
import { Prisma, TripStatus, VehicleStatus, DriverStatus } from "@prisma/client";
import { badRequest, conflict, notFound } from "@/lib/api/errors";
import { recordAudit } from "./audit";
import { isLicenseExpired } from "./driver.service";
import type { TripCreateInput, TripCompleteInput } from "@/lib/validation/trip";

export type TripFilters = { status?: TripStatus; search?: string };

const tripInclude = {
  vehicle: { select: { id: true, registrationNo: true, name: true, maxLoadKg: true } },
  driver: { select: { id: true, name: true, licenseNo: true } },
} satisfies Prisma.TripInclude;

export function listTrips(filters: TripFilters = {}) {
  const where: Prisma.TripWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: "insensitive" } },
      { source: { contains: filters.search, mode: "insensitive" } },
      { destination: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  return prisma.trip.findMany({
    where,
    include: tripInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getTrip(id: string) {
  const trip = await prisma.trip.findUnique({ where: { id }, include: tripInclude });
  if (!trip) throw notFound("Trip not found");
  return trip;
}

async function nextTripCode(db: Prisma.TransactionClient) {
  const count = await db.trip.count();
  return `TRP-${String(count + 1).padStart(4, "0")}`;
}

/**
 * Validate that a vehicle + driver can carry a load, enforcing the mandatory
 * business rules. Throws a friendly error on the first violation.
 */
async function assertAssignable(
  db: Prisma.TransactionClient,
  vehicleId: string,
  driverId: string,
  cargoWeightKg: number,
) {
  const [vehicle, driver] = await Promise.all([
    db.vehicle.findUnique({ where: { id: vehicleId } }),
    db.driver.findUnique({ where: { id: driverId } }),
  ]);

  if (!vehicle) throw notFound("Selected vehicle no longer exists");
  if (!driver) throw notFound("Selected driver no longer exists");

  // Rule: retired / in-shop vehicles never dispatch; on-trip is already busy.
  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw conflict(
      `${vehicle.registrationNo} is ${vehicle.status.toLowerCase().replace("_", " ")} and cannot be dispatched.`,
    );
  }
  // Rule: suspended / expired-license / busy drivers cannot be assigned.
  if (driver.status === DriverStatus.SUSPENDED) {
    throw conflict(`${driver.name} is suspended and cannot be assigned.`);
  }
  if (driver.status !== DriverStatus.AVAILABLE) {
    throw conflict(`${driver.name} is ${driver.status.toLowerCase().replace("_", " ")} right now.`);
  }
  if (isLicenseExpired(driver.licenseExpiry)) {
    throw conflict(`${driver.name}'s license has expired and cannot be assigned.`);
  }
  // Rule: cargo weight must not exceed capacity.
  if (cargoWeightKg > vehicle.maxLoadKg.toNumber()) {
    throw badRequest(
      `Cargo weight ${cargoWeightKg} kg exceeds ${vehicle.registrationNo}'s capacity of ${vehicle.maxLoadKg} kg.`,
    );
  }

  return { vehicle, driver };
}

/** Create a trip in DRAFT state. Validates assignment but does not reserve yet. */
export async function createTrip(input: TripCreateInput, actorId?: string | null) {
  return prisma.$transaction(async (tx) => {
    await assertAssignable(tx, input.vehicleId, input.driverId, input.cargoWeightKg);
    const code = await nextTripCode(tx);
    const trip = await tx.trip.create({
      data: {
        code,
        source: input.source,
        destination: input.destination,
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        cargoWeightKg: input.cargoWeightKg,
        plannedDistance: input.plannedDistance,
        revenue: input.revenue ?? 0,
        status: TripStatus.DRAFT,
        createdById: actorId ?? null,
      },
      include: tripInclude,
    });
    await recordAudit(tx, {
      entity: "Trip",
      entityId: trip.id,
      action: "CREATE",
      summary: `Created trip ${trip.code}: ${trip.source} → ${trip.destination}`,
      actorId,
    });
    return trip;
  });
}

/** Dispatch a DRAFT trip: re-validate, then flip vehicle + driver to ON_TRIP. */
export async function dispatchTrip(id: string, actorId?: string | null) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id } });
    if (!trip) throw notFound("Trip not found");
    if (trip.status !== TripStatus.DRAFT) {
      throw conflict(`Only draft trips can be dispatched (this one is ${trip.status.toLowerCase()}).`);
    }

    const { vehicle } = await assertAssignable(
      tx,
      trip.vehicleId,
      trip.driverId,
      trip.cargoWeightKg.toNumber(),
    );

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: VehicleStatus.ON_TRIP },
    });
    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: DriverStatus.ON_TRIP },
    });

    const updated = await tx.trip.update({
      where: { id },
      data: {
        status: TripStatus.DISPATCHED,
        dispatchedAt: new Date(),
        startOdometer: vehicle.odometerKm,
      },
      include: tripInclude,
    });
    await recordAudit(tx, {
      entity: "Trip",
      entityId: id,
      action: "DISPATCH",
      summary: `Dispatched trip ${trip.code}`,
      actorId,
    });
    return updated;
  });
}

/** Complete a DISPATCHED trip: record odometer/fuel and free the vehicle + driver. */
export async function completeTrip(
  id: string,
  input: TripCompleteInput,
  actorId?: string | null,
) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id } });
    if (!trip) throw notFound("Trip not found");
    if (trip.status !== TripStatus.DISPATCHED) {
      throw conflict("Only dispatched trips can be completed.");
    }
    if (trip.startOdometer != null && input.endOdometer < trip.startOdometer) {
      throw badRequest(
        `Final odometer (${input.endOdometer}) cannot be less than the start (${trip.startOdometer}).`,
      );
    }

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: VehicleStatus.AVAILABLE, odometerKm: input.endOdometer },
    });
    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: DriverStatus.AVAILABLE },
    });

    const updated = await tx.trip.update({
      where: { id },
      data: {
        status: TripStatus.COMPLETED,
        completedAt: new Date(),
        endOdometer: input.endOdometer,
        fuelConsumedL: input.fuelConsumedL,
        ...(input.revenue != null ? { revenue: input.revenue } : {}),
      },
      include: tripInclude,
    });
    await recordAudit(tx, {
      entity: "Trip",
      entityId: id,
      action: "COMPLETE",
      summary: `Completed trip ${trip.code}`,
      actorId,
    });
    return updated;
  });
}

/** Cancel a trip. If it was dispatched, restore the vehicle + driver to AVAILABLE. */
export async function cancelTrip(id: string, actorId?: string | null) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id } });
    if (!trip) throw notFound("Trip not found");
    if (trip.status === TripStatus.COMPLETED) {
      throw conflict("Completed trips cannot be cancelled.");
    }
    if (trip.status === TripStatus.CANCELLED) {
      throw conflict("This trip is already cancelled.");
    }

    if (trip.status === TripStatus.DISPATCHED) {
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      });
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.AVAILABLE },
      });
    }

    const updated = await tx.trip.update({
      where: { id },
      data: { status: TripStatus.CANCELLED, cancelledAt: new Date() },
      include: tripInclude,
    });
    await recordAudit(tx, {
      entity: "Trip",
      entityId: id,
      action: "CANCEL",
      summary: `Cancelled trip ${trip.code}`,
      actorId,
    });
    return updated;
  });
}
