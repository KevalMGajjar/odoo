"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { VEHICLE_STATUS_META } from "@/lib/display";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/lib/types";

/**
 * Vehicle dropdown that renders each option's status as a real status pill.
 * A native <select> can only hold text, so this is a custom listbox.
 */
export function VehiclePicker({
  vehicles,
  value,
  onChange,
  placeholder = "Select a vehicle",
  disabled,
}: {
  vehicles: Vehicle[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = vehicles.find((v) => v.id === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[4px] border border-line bg-panel-2 px-3 py-2 text-left text-sm transition-colors",
          "focus:border-accent disabled:opacity-50",
          open && "border-accent",
        )}
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="numeric truncate text-fg">{selected.registrationNo}</span>
            <span className="truncate text-xs text-muted">{selected.name}</span>
            <StatusBadge
              tone={VEHICLE_STATUS_META[selected.status].tone}
              label={VEHICLE_STATUS_META[selected.status].label}
            />
          </span>
        ) : (
          <span className="text-faint">{placeholder}</span>
        )}
        <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-[4px] border border-line-strong bg-panel p-1 shadow-2xl animate-fade-up"
        >
          {vehicles.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted">No vehicles available</li>
          )}
          {vehicles.map((v) => {
            const meta = VEHICLE_STATUS_META[v.status];
            const active = v.id === value;
            return (
              <li key={v.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(v.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[3px] px-2.5 py-2 text-left transition-colors",
                    active ? "bg-panel-2" : "hover:bg-panel-2/70",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="numeric block truncate text-sm text-fg">{v.registrationNo}</span>
                    <span className="block truncate text-[11px] text-muted">{v.name}</span>
                  </span>
                  <StatusBadge tone={meta.tone} label={meta.label} />
                  {active && <Check className="size-3.5 shrink-0 text-accent" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
