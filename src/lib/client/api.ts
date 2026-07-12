"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export class ApiError extends Error {
  details?: { path: string; message: string }[];
  code?: string;
  constructor(message: string, code?: string, details?: ApiError["details"]) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: ApiError["details"] } };

/** Fire a mutating request and unwrap the envelope, throwing ApiError on failure. */
export async function apiFetch<T = unknown>(
  url: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  let json: Envelope<T>;
  try {
    const res = await fetch(url, {
      method: opts.method ?? "POST",
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    json = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError("Network error — please try again.");
  }
  if (!json.ok) throw new ApiError(json.error.message, json.error.code, json.error.details);
  return json.data;
}

type UseApiOptions = { refreshInterval?: number; enabled?: boolean };

/**
 * Read hook with loading/error state and optional polling (for live data).
 * Returns { data, error, loading, refresh }.
 */
export function useApi<T = unknown>(url: string | null, opts: UseApiOptions = {}) {
  const { refreshInterval, enabled = true } = opts;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const first = useRef(true);

  const refresh = useCallback(async () => {
    if (!url || !enabled) return;
    try {
      const res = await fetch(url);
      const json = (await res.json()) as Envelope<T>;
      if (!json.ok) throw new Error(json.error.message);
      setData(json.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [url, enabled]);

  useEffect(() => {
    first.current = true;
    setLoading(true);
    refresh();
    if (refreshInterval && enabled) {
      const id = setInterval(refresh, refreshInterval);
      return () => clearInterval(id);
    }
  }, [refresh, refreshInterval, enabled]);

  return { data, error, loading, refresh };
}
