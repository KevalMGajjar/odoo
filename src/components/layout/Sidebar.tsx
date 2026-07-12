"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, X } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { can, type PermissionMap, ROLE_LABELS } from "@/lib/auth/rbac";
import type { RoleKey } from "@prisma/client";
import { cn } from "@/lib/utils";

export function Sidebar({
  permissions,
  role,
  open,
  onClose,
}: {
  permissions: PermissionMap;
  role: RoleKey;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => can(permissions, i.module, "view"));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/70 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-panel transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="grid size-7 place-items-center rounded-[3px] bg-accent text-[var(--accent-ink)]">
              <Truck className="size-4" />
            </div>
            <div className="leading-none">
              <p className="text-sm font-semibold tracking-tight text-fg">TransitOps</p>
              <p className="label-tech mt-1">Fleet Control</p>
            </div>
          </Link>
          <button className="text-muted hover:text-fg lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="size-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-[3px] px-2.5 py-2 text-[13px] transition-colors",
                  active
                    ? "bg-panel-2 text-fg"
                    : "text-muted hover:bg-panel-2/60 hover:text-fg",
                )}
              >
                {/* Active rail — a hard signal bar, not a glow */}
                {active && (
                  <span className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-accent" />
                )}
                <Icon className={cn("size-4 shrink-0", active && "text-accent")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Role */}
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2 rounded-[3px] border border-line bg-panel-2 px-2.5 py-2">
            <span className="size-1.5 rounded-full bg-available live-dot" />
            <span className="label-tech">{ROLE_LABELS[role]}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
