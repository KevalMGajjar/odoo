import { prisma } from "@/lib/db";
import { Prisma, DriverStatus } from "@prisma/client";
import { notFound } from "@/lib/api/errors";
import { recordAudit } from "./audit";
import type { DriverCreateInput, DriverUpdateInput } from "@/lib/validation/driver";

export type DriverFilters = { status?: DriverStatus; search?: string };

/** Start of today — licenses expiring before this are considered expired. */
function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isLicenseExpired(expiry: Date) {
  return expiry.getTime() < today().getTime();
}

export function listDrivers(filters: DriverFilters = {}) {
  const where: Prisma.DriverWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { licenseNo: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  return prisma.driver.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function getDriver(id: string) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw notFound("Driver not found");
  return driver;
}

/**
 * Drivers eligible for dispatch: AVAILABLE, not suspended, license not expired.
 * Enforces the "expired license / suspended cannot be assigned" business rule.
 */
export function assignableDrivers() {
  return prisma.driver.findMany({
    where: {
      status: DriverStatus.AVAILABLE,
      licenseExpiry: { gte: today() },
    },
    orderBy: { name: "asc" },
  });
}

export async function createDriver(input: DriverCreateInput, actorId?: string | null) {
  const driver = await prisma.driver.create({
    data: {
      name: input.name,
      licenseNo: input.licenseNo,
      licenseCategory: input.licenseCategory,
      licenseExpiry: input.licenseExpiry,
      contact: input.contact,
      safetyScore: input.safetyScore ?? 100,
      status: input.status ?? DriverStatus.AVAILABLE,
    },
  });
  await recordAudit(prisma, {
    entity: "Driver",
    entityId: driver.id,
    action: "CREATE",
    summary: `Added driver ${driver.name} (${driver.licenseNo})`,
    actorId,
  });
  return driver;
}

export async function updateDriver(id: string, input: DriverUpdateInput, actorId?: string | null) {
  await getDriver(id);
  const driver = await prisma.driver.update({ where: { id }, data: input });
  await recordAudit(prisma, {
    entity: "Driver",
    entityId: id,
    action: "UPDATE",
    summary: `Updated driver ${driver.name}`,
    actorId,
  });
  return driver;
}
