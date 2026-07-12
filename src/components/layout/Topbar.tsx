"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/client/api";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import type { RoleKey } from "@prisma/client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Topbar({
  user,
  onMenu,
}: {
  user: { name: string; email: string; role: RoleKey };
  onMenu: () => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [clock, setClock] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const logout = async () => {
    await apiFetch("/api/auth/logout").catch(() => {});
    router.push("/login");
    router.refresh();
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-bg/95 px-4 sm:px-6">
      <button className="text-muted hover:text-fg lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="size-5" />
      </button>

      {/* Live telemetry strip */}
      <div className="hidden items-center gap-2 sm:flex">
        <span className="size-1.5 rounded-full bg-available live-dot" />
        <span className="label-tech">Live</span>
        <span className="numeric text-xs text-muted">{clock} IST</span>
      </div>

      <div className="ml-auto flex items-center gap-2" ref={ref}>
        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-[4px] border border-line bg-panel py-1 pl-1 pr-2.5 transition-colors hover:border-line-strong"
          >
            <span className="grid size-7 place-items-center rounded-[3px] bg-accent text-[11px] font-bold text-[var(--accent-ink)]">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-medium leading-none text-fg">{user.name}</span>
              <span className="label-tech mt-1 block">{ROLE_LABELS[user.role]}</span>
            </span>
            <ChevronDown className="size-3.5 text-muted" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-[4px] border border-line-strong bg-panel p-1 shadow-2xl animate-fade-up">
              <div className="border-b border-line px-3 py-2">
                <p className="text-sm font-medium text-fg">{user.name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="mt-1 flex w-full items-center gap-2 rounded-[3px] px-3 py-2 text-sm text-muted transition-colors hover:bg-panel-2 hover:text-fg"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
