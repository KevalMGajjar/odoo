import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/display";
import { TONE_CLASS } from "@/lib/display";

/** Instrument-panel readout: tech label, large mono value, signal accent. */
export function Kpi({
  label,
  value,
  suffix,
  icon,
  tone = "accent",
  hint,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon?: React.ReactNode;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className="panel relative p-3.5 transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="label-tech">{label}</p>
          <p className="numeric mt-2 text-2xl font-semibold text-fg">
            {value}
            {suffix && <span className="ml-0.5 text-sm font-normal text-muted">{suffix}</span>}
          </p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        {icon && (
          <div
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-[3px] border",
              TONE_CLASS[tone],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
