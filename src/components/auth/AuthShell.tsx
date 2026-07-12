import Link from "next/link";
import { Truck } from "lucide-react";

/**
 * Auth page chrome: a NARROW brand rail on the left, the form on the right.
 * The rail is a pure-SVG route schematic (no WebGL) — crisp, cheap, and on-brand
 * for the control-room aesthetic.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
      {/* Brand rail */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-panel lg:flex lg:flex-col">
        <RouteSchematic />

        <div className="relative z-10 flex h-full flex-col justify-between p-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-[3px] bg-accent text-[var(--accent-ink)]">
              <Truck className="size-4.5" />
            </div>
            <div className="leading-none">
              <p className="text-sm font-semibold tracking-tight text-fg">TransitOps</p>
              <p className="label-tech mt-1">Fleet Control</p>
            </div>
          </Link>

          <div>
            <p className="label-tech mb-3">Operations Platform</p>
            <h2 className="text-xl font-semibold leading-snug text-fg">
              Every vehicle, driver and rupee — <span className="text-accent">accounted for.</span>
            </h2>
            <ul className="mt-6 space-y-2">
              {[
                "Dispatch with rules enforced",
                "Maintenance & compliance",
                "Fuel, cost and ROI analytics",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2 text-xs text-muted">
                  <span className="size-1 rounded-full bg-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <p className="label-tech">© {new Date().getFullYear()} TransitOps</p>
        </div>
      </aside>

      {/* Form side */}
      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}

/** Animated logistics network — dashed routes pulsing between depot nodes. */
function RouteSchematic() {
  const nodes = [
    [40, 60],
    [150, 30],
    [250, 90],
    [70, 170],
    [190, 200],
    [280, 250],
    [110, 300],
    [230, 350],
    [60, 400],
  ] as const;

  const edges = [
    [0, 1],
    [1, 2],
    [0, 3],
    [3, 4],
    [4, 5],
    [3, 6],
    [6, 7],
    [4, 7],
    [6, 8],
    [1, 4],
  ] as const;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.5]"
      viewBox="0 0 320 460"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke="var(--accent)"
          strokeWidth="1"
          strokeDasharray="3 6"
          strokeOpacity="0.5"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="18"
            to="0"
            dur={`${1.6 + (i % 4) * 0.5}s`}
            repeatCount="indefinite"
          />
        </line>
      ))}
      {nodes.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="2.5" fill="var(--accent)" />
          <circle cx={x} cy={y} r="7" fill="none" stroke="var(--accent)" strokeWidth="0.6" strokeOpacity="0.35">
            <animate
              attributeName="r"
              values="4;11;4"
              dur={`${2.4 + (i % 3) * 0.7}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-opacity"
              values="0.5;0;0.5"
              dur={`${2.4 + (i % 3) * 0.7}s`}
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}
    </svg>
  );
}
