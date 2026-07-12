"use client";
import { ShieldCheck, Truck } from "lucide-react";
import { LICENSE_LABEL } from "@/lib/display";
import { formatDate, daysUntilDate } from "@/lib/format";
import type { LicenseCategory } from "@prisma/client";

/**
 * A photorealistic driving licence that rotates 360° and updates live as the
 * form is filled. Pure CSS 3D so the text stays crisp (no WebGL texturing).
 */
export function DriverLicense3D({
  name,
  licenseNo,
  category,
  expiry,
  contact,
  safetyScore,
  spinning = true,
}: {
  name: string;
  licenseNo: string;
  category: LicenseCategory | "";
  expiry: string;
  contact: string;
  safetyScore: number;
  spinning?: boolean;
}) {
  const initials = (name || "New Driver")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const expDays = expiry ? daysUntilDate(expiry) : null;
  const expired = expDays !== null && expDays < 0;

  return (
    <div className="license-scene grid place-items-center py-4" style={{ perspective: "1400px" }}>
      <div className={`license-card ${spinning ? "license-spin" : ""}`}>
        {/* FRONT */}
        <div className="license-face license-front">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="grid size-6 place-items-center rounded bg-gradient-to-br from-accent to-accent-strong text-black">
                <Truck className="size-3.5" />
              </div>
              <div className="leading-none">
                <p className="text-[8px] uppercase tracking-[0.2em] text-amber-200/80">TransitOps</p>
                <p className="text-[10px] font-semibold tracking-wide text-white">Transport Authority</p>
              </div>
            </div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-amber-300">Driving Licence</p>
          </div>

          <div className="mt-3 flex gap-3">
            <div className="grid size-16 shrink-0 place-items-center rounded-md bg-gradient-to-br from-zinc-700 to-zinc-900 text-lg font-bold text-amber-200 ring-1 ring-white/10">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-white">{name || "—"}</p>
              <p className="mt-0.5 font-mono text-[11px] tracking-wide text-amber-200/90">{licenseNo || "DL-•• ••••-••••"}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 ring-1 ring-amber-300/30">
                  {category || "CAT"}
                </span>
                <span className="text-[9px] text-zinc-400">{category ? LICENSE_LABEL[category].split(" — ")[1] : "Class"}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[8px] uppercase tracking-wider text-zinc-500">Valid Through</p>
              <p className={`text-[11px] font-medium ${expired ? "text-red-400" : "text-white"}`}>
                {expiry ? formatDate(expiry) : "—"}
                {expired && <span className="ml-1 text-[8px]">EXPIRED</span>}
              </p>
            </div>
            {/* Holographic foil */}
            <div className="license-holo size-9 rounded-full" />
          </div>
        </div>

        {/* BACK */}
        <div className="license-face license-back">
          <div className="license-magstripe" />
          <div className="mt-3 space-y-2">
            <Row label="Contact" value={contact || "—"} />
            <div>
              <p className="text-[8px] uppercase tracking-wider text-zinc-500">Safety Score</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400"
                    style={{ width: `${Math.max(0, Math.min(100, safetyScore))}%` }}
                  />
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-white">
                  <ShieldCheck className="size-3 text-emerald-400" />
                  {safetyScore}
                </span>
              </div>
            </div>
          </div>
          <div className="license-barcode mt-3" />
          <p className="mt-2 text-center text-[7px] uppercase tracking-[0.2em] text-zinc-500">
            TransitOps · Government of Maharashtra · India
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[8px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="font-mono text-[11px] text-white">{value}</p>
    </div>
  );
}
