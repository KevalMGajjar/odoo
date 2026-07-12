import { cn } from "@/lib/utils";
import { TONE_CLASS, type Tone } from "@/lib/display";

/** Square-ish status chip with a signal dot — reads like an instrument indicator. */
export function StatusBadge({
  tone,
  label,
  dot = true,
  className,
}: {
  tone: Tone;
  label: string;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[3px] border px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {label}
    </span>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[3px] border border-line bg-panel-2 px-1.5 py-0.5 text-[11px] text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
