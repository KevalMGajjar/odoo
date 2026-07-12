"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { PermissionsProvider } from "./PermissionsProvider";
import type { PermissionMap } from "@/lib/auth/rbac";
import type { RoleKey } from "@prisma/client";

export function AppShell({
  user,
  permissions,
  children,
}: {
  user: { name: string; email: string; role: RoleKey };
  permissions: PermissionMap;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <Sidebar permissions={permissions} role={user.role} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-60">
        <Topbar user={user} onMenu={() => setOpen(true)} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
            <PermissionsProvider permissions={permissions}>{children}</PermissionsProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
