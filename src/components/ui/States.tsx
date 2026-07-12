import { Loader2, Inbox, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-accent", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

/** Placeholder rows for a loading table. */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-5 flex-1", c === 0 && "max-w-[22%]")} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-xl bg-white/5 text-muted">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <div>
        <p className="font-medium text-fg">{title}</p>
        {message && <p className="mt-1 text-sm text-muted max-w-sm">{message}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-xl bg-danger/10 text-danger">
        <TriangleAlert className="size-6" />
      </div>
      <div>
        <p className="font-medium text-fg">Something went wrong</p>
        <p className="mt-1 text-sm text-muted max-w-sm">{message ?? "Failed to load data."}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
