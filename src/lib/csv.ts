type Column<T> = { key: keyof T; header: string };

/** Serialize rows to RFC-4180 CSV, quoting values that need it. */
export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: Column<T>[]): string {
  const escape = (val: unknown) => {
    const s = val == null ? "" : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.header)).join(",");
  const body = rows.map((row) => columns.map((c) => escape(row[c.key])).join(",")).join("\n");
  return `${header}\n${body}`;
}
