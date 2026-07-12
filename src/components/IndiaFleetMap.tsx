"use client";
import { useMemo, useState } from "react";
import { INDIA_STATES, INDIA_VIEWBOX, STATE_NAME } from "@/lib/india-map";

type Datum = { region: string; count: number };

/**
 * Choropleth of the active fleet per Indian state.
 * Plain SVG — no WebGL, so it costs nothing to render and never loses a context.
 */
export function IndiaFleetMap({ data }: { data: Datum[] }) {
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data) m.set(d.region, d.count);
    return m;
  }, [data]);

  const max = useMemo(() => Math.max(1, ...data.map((d) => d.count)), [data]);

  // 0 vehicles -> inert panel fill; otherwise ramp the signal colour by density.
  const fillFor = (code: string) => {
    const n = counts.get(code) ?? 0;
    if (n === 0) return { fill: "var(--panel-2)", opacity: 1 };
    const t = 0.28 + 0.72 * (n / max); // keep the lightest bucket clearly visible
    return { fill: "var(--accent)", opacity: t };
  };

  const hovered = hover ? counts.get(hover.code) ?? 0 : 0;

  return (
    // h-full/w-full so the SVG scales to fit the card rather than rendering at its
    // intrinsic size and spilling out. (Tooltip stays outside any clipping context.)
    <div className="relative h-full w-full">
      <svg
        viewBox={INDIA_VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        className="block h-full w-full"
        role="img"
        aria-label="Fleet distribution across Indian states"
        onMouseLeave={() => setHover(null)}
      >
        {INDIA_STATES.map((s) => {
          const { fill, opacity } = fillFor(s.code);
          const active = hover?.code === s.code;
          return (
            <path
              key={s.code}
              d={s.d}
              fill={fill}
              fillOpacity={opacity}
              stroke={active ? "var(--fg)" : "var(--line-strong)"}
              strokeWidth={active ? 1.1 : 0.5}
              className="cursor-pointer transition-[stroke,stroke-width] duration-100"
              onMouseMove={(e) => {
                const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setHover({
                  code: s.code,
                  x: e.clientX - box.left,
                  y: e.clientY - box.top,
                });
              }}
            />
          );
        })}
      </svg>

      {/* Tooltip — state + fleet count, nothing else. */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[3px] border border-line-strong bg-panel px-2 py-1 shadow-lg"
          style={{ left: hover.x, top: hover.y - 8 }}
        >
          <p className="whitespace-nowrap text-xs font-medium text-fg">
            {STATE_NAME[hover.code] ?? hover.code}
          </p>
          <p className="numeric text-[11px] text-accent">
            {hovered} vehicle{hovered === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}

/** Density legend for the map. */
export function MapLegend({ max }: { max: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="label-tech">0</span>
      <div className="flex h-2 w-24">
        {[0.28, 0.46, 0.64, 0.82, 1].map((o) => (
          <div key={o} className="flex-1" style={{ background: "var(--accent)", opacity: o }} />
        ))}
      </div>
      <span className="label-tech">{max}</span>
    </div>
  );
}
