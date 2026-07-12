"use client";
import { createContext, useContext } from "react";
import { can as canFn, type PermissionMap, type ModuleKey, type AccessLevel } from "@/lib/auth/rbac";

const Ctx = createContext<PermissionMap | null>(null);

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: PermissionMap;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={permissions}>{children}</Ctx.Provider>;
}

export function usePermissions() {
  const permissions = useContext(Ctx);
  return {
    permissions,
    can: (module: ModuleKey, level: Exclude<AccessLevel, "none"> = "view") =>
      permissions ? canFn(permissions, module, level) : false,
  };
}
