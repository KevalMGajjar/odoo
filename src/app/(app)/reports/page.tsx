"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import { Gauge, IndianRupee, Fuel, TrendingUp, Download, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Kpi } from "@/components/ui/Kpi";
import { Button } from "@/components/ui/Button";
import { Table, THead, TBody, Th, Td, TRow } from "@/components/ui/Table";
import { TableSkeleton, ErrorState, EmptyState } from "@/components/ui/States";
import { useApi } from "@/lib/client/api";
import { formatMoney, formatNumber } from "@/lib/utils";
import type { ReportData } from "@/lib/types";

const AXIS = { fontSize: 11, fill: "#6b7280" };

type TooltipProps = {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  prefix?: string;
};
function ChartTooltip({ active, payload, label, prefix = "" }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-bg-elevated px-3 py-2 text-xs shadow-xl">
      <p className="mb-0.5 font-medium text-fg">{label}</p>
      <p className="text-muted">
        {prefix}
        {formatNumber(payload[0].value)}
      </p>
    </div>
  );
}

export default function ReportsPage() {
  const { data, loading, error, refresh } = useApi<ReportData>("/api/reports", { refreshInterval: 30000 });

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Fuel efficiency, utilization, cost and ROI across the fleet.">
        <a href="/api/reports/export" download>
          <Button variant="secondary">
            <Download className="size-4" /> Export CSV
          </Button>
        </a>
      </PageHeader>

      {error && !data ? (
        <Card>
          <ErrorState message={error} onRetry={refresh} />
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Kpi label="Fuel Efficiency" value={data?.summary.fuelEfficiency ?? "—"} suffix="km/L" icon={<Fuel className="size-4" />} tone="ontrip" />
            <Kpi label="Fleet Utilization" value={data?.summary.fleetUtilization ?? "—"} suffix="%" icon={<Gauge className="size-4" />} tone="accent" />
            <Kpi label="Operational Cost" value={data ? formatMoney(data.summary.operationalCost) : "—"} icon={<IndianRupee className="size-4" />} tone="inshop" />
            <Kpi label="Total Revenue" value={data ? formatMoney(data.summary.revenue) : "—"} icon={<TrendingUp className="size-4" />} tone="available" />
            <Kpi label="Fleet ROI" value={data ? `${(data.summary.fleetRoi * 100).toFixed(1)}%` : "—"} icon={<BarChart3 className="size-4" />} tone="accent" />
          </div>

          {/* Charts */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Monthly Revenue" subtitle="Completed trips, last 6 months" icon={<TrendingUp className="size-4" />} />
              <div className="h-64 p-4">
                {data ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyRevenue} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1d212a" vertical={false} />
                      <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip content={<ChartTooltip prefix="₹" />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Bar dataKey="revenue" fill="var(--color-accent)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="size-full skeleton rounded-lg" />
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Top Operational Cost" subtitle="Fuel + maintenance + expenses" icon={<IndianRupee className="size-4" />} />
              <div className="h-64 p-4">
                {data ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topCostVehicles} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                      <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                      <YAxis type="category" dataKey="registrationNo" tick={AXIS} axisLine={false} tickLine={false} width={92} />
                      <Tooltip content={<ChartTooltip prefix="₹" />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Bar dataKey="operationalCost" radius={[0, 6, 6, 0]} maxBarSize={22}>
                        {data.topCostVehicles.map((_, i) => (
                          <Cell key={i} fill={["#f5a524", "#38bdf8", "#34d399", "#a78bfa", "#fb7185"][i % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="size-full skeleton rounded-lg" />
                )}
              </div>
            </Card>
          </div>

          {/* Per-vehicle table */}
          <Card>
            <CardHeader title="Per-Vehicle Economics" subtitle="Revenue, cost and ROI by vehicle" icon={<BarChart3 className="size-4" />} />
            {loading && !data ? (
              <TableSkeleton rows={6} cols={7} />
            ) : data && data.vehicles.length > 0 ? (
              <Table>
                <THead>
                  <tr>
                    <Th>Vehicle</Th>
                    <Th className="text-right">Revenue</Th>
                    <Th className="text-right">Fuel</Th>
                    <Th className="text-right">Maintenance</Th>
                    <Th className="text-right">Op. Cost</Th>
                    <Th className="text-right">Efficiency</Th>
                    <Th className="text-right">ROI</Th>
                  </tr>
                </THead>
                <TBody>
                  {data.vehicles.map((v) => (
                    <TRow key={v.id}>
                      <Td className="font-medium text-fg">
                        {v.registrationNo}
                        <span className="ml-1 text-xs text-faint">{v.name}</span>
                      </Td>
                      <Td className="text-right tabular-nums text-available">{formatMoney(v.revenue)}</Td>
                      <Td className="text-right tabular-nums">{formatMoney(v.fuelCost)}</Td>
                      <Td className="text-right tabular-nums">{formatMoney(v.maintenanceCost)}</Td>
                      <Td className="text-right tabular-nums">{formatMoney(v.operationalCost)}</Td>
                      <Td className="text-right tabular-nums text-muted">{v.fuelEfficiency ? `${v.fuelEfficiency} km/L` : "—"}</Td>
                      <Td className={`text-right font-semibold tabular-nums ${v.roi >= 0 ? "text-available" : "text-danger"}`}>
                        {(v.roi * 100).toFixed(1)}%
                      </Td>
                    </TRow>
                  ))}
                </TBody>
              </Table>
            ) : (
              <EmptyState title="No data yet" message="Complete trips and log costs to see analytics." />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
