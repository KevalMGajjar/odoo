import type { RoleKey } from "@prisma/client";

/** Application modules that can be permission-gated. */
export const MODULES = [
  "dashboard",
  "vehicles",
  "drivers",
  "trips",
  "maintenance",
  "fuel",
  "reports",
  "settings",
] as const;

export type ModuleKey = (typeof MODULES)[number];
export type AccessLevel = "none" | "view" | "edit";

export type PermissionMap = Record<ModuleKey, AccessLevel>;

const none = (): PermissionMap =>
  MODULES.reduce((acc, m) => ({ ...acc, [m]: "none" }), {} as PermissionMap);

/**
 * The permission matrix. Deliberately HARDCODED and enforced server-side on every
 * request — it is not runtime-editable.
 *
 * Why: permissions are tied to job function. If the matrix were editable in the UI,
 * a Safety Officer could grant themselves trip-dispatch rights, which is a privilege-
 * escalation hole. What a Fleet Manager *does* control dynamically is **who holds
 * which role** (user management), not what each role can do.
 */
export const ROLE_PERMISSIONS: Record<RoleKey, PermissionMap> = {
  // Fleet Manager — owns assets & maintenance, and administers user accounts.
  FLEET_MANAGER: {
    ...none(),
    dashboard: "view",
    vehicles: "edit",
    drivers: "view",
    trips: "view",
    maintenance: "edit",
    fuel: "view",
    reports: "view",
    settings: "edit", // user management (create users, reassign roles)
  },
  // Driver — runs trips; needs to see fleet & drivers to assign them, and logs fuel.
  DRIVER: {
    ...none(),
    dashboard: "view",
    vehicles: "view",
    drivers: "view",
    trips: "edit",
    maintenance: "view",
    fuel: "edit",
    reports: "view",
  },
  // Safety Officer — driver compliance, licences, safety scores.
  SAFETY_OFFICER: {
    ...none(),
    dashboard: "view",
    vehicles: "view",
    drivers: "edit",
    trips: "view",
    maintenance: "view",
    reports: "view",
  },
  // Financial Analyst — costs, fuel, expenses, analytics.
  FINANCIAL_ANALYST: {
    ...none(),
    dashboard: "view",
    vehicles: "view",
    drivers: "view",
    trips: "view",
    maintenance: "view",
    fuel: "edit",
    reports: "view",
  },
};

/** Does this permission map allow the required level on a module? */
export function can(
  permissions: PermissionMap,
  module: ModuleKey,
  level: Exclude<AccessLevel, "none"> = "view",
): boolean {
  const granted = permissions[module] ?? "none";
  if (granted === "edit") return true;
  if (granted === "view") return level === "view";
  return false;
}

export const ROLE_LABELS: Record<RoleKey, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Driver",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

export const ROLE_KEYS: RoleKey[] = [
  "FLEET_MANAGER",
  "DRIVER",
  "SAFETY_OFFICER",
  "FINANCIAL_ANALYST",
];
