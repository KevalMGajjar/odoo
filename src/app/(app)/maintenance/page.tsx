"use client";
import { useMemo, useState } from "react";
import { Plus, Wrench, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/Badge";
import { Table, THead, TBody, Th, Td, TRow } from "@/components/ui/Table";
import { TableSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useApi, apiFetch, ApiError } from "@/lib/client/api";
import { usePermissions } from "@/components/layout/PermissionsProvider";
import { VehiclePicker } from "@/components/VehiclePicker";
import { MAINTENANCE_STATUS_META, MAINTENANCE_TYPE_LABEL, enumOptions } from "@/lib/display";
import { formatMoney } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { Maintenance, Vehicle } from "@/lib/types";

export default function MaintenancePage() {
  const { can } = usePermissions();
  const { toast } = useToast();
  const canEdit = can("maintenance", "edit");

  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const url = statusFilter ? `/api/maintenance?status=${statusFilter}` : "/api/maintenance";
  const { data, loading, error, refresh } = useApi<Maintenance[]>(url, { refreshInterval: 20000 });

  const close = async (m: Maintenance) => {
    if (!confirm(`Close this service for ${m.vehicle.registrationNo}? The vehicle returns to Available.`)) return;
    try {
      await apiFetch(`/api/maintenance/${m.id}/close`, { method: "POST" });
      toast(`${m.vehicle.registrationNo} service closed`);
      refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to close", "error");
    }
  };

  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Opening a job sends the vehicle to the shop automatically.">
        {canEdit && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Log Maintenance
          </Button>
        )}
      </PageHeader>

      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-line-soft p-4">
          <p className="text-sm text-muted">Service records</p>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "", label: "All" },
              { value: "OPEN", label: "In Shop" },
              { value: "CLOSED", label: "Completed" },
            ]}
            className="w-40"
          />
        </div>

        {error && !data ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : loading && !data ? (
          <TableSkeleton rows={5} cols={6} />
        ) : data && data.length > 0 ? (
          <Table>
            <THead>
              <tr>
                <Th>Vehicle</Th>
                <Th>Type</Th>
                <Th>Description</Th>
                <Th className="text-right">Cost</Th>
                <Th>Opened</Th>
                <Th>Status</Th>
                {canEdit && <Th className="text-right">Action</Th>}
              </tr>
            </THead>
            <TBody>
              {data.map((m) => (
                <TRow key={m.id}>
                  <Td className="font-medium text-fg">
                    {m.vehicle.registrationNo}
                    <span className="ml-1 text-xs text-faint">{m.vehicle.name}</span>
                  </Td>
                  <Td>{MAINTENANCE_TYPE_LABEL[m.type]}</Td>
                  <Td className="max-w-xs truncate text-muted">{m.description}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(m.cost)}</Td>
                  <Td className="text-muted">{formatDate(m.openedAt)}</Td>
                  <Td>
                    <StatusBadge tone={MAINTENANCE_STATUS_META[m.status].tone} label={MAINTENANCE_STATUS_META[m.status].label} />
                  </Td>
                  {canEdit && (
                    <Td className="text-right">
                      {m.status === "OPEN" ? (
                        <Button size="sm" variant="secondary" onClick={() => close(m)}>
                          <CheckCircle2 className="size-3.5" /> Close
                        </Button>
                      ) : (
                        <span className="text-xs text-faint">—</span>
                      )}
                    </Td>
                  )}
                </TRow>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState title="No maintenance records" message="Log a service to move a vehicle to the shop." icon={<Wrench className="size-6" />} />
        )}
      </Card>

      {canEdit && <MaintenanceModal open={open} onClose={() => setOpen(false)} onSaved={refresh} />}
    </div>
  );
}

function MaintenanceModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const { data: vehicles } = useApi<Vehicle[]>(open ? "/api/vehicles" : null);
  const [form, setForm] = useState({ vehicleId: "", type: "OIL_CHANGE" as string, description: "", cost: "0", odometerKm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Retired vehicles are never serviced, so they're not offered.
  const selectable = useMemo(
    () => (vehicles ?? []).filter((v) => v.status !== "RETIRED"),
    [vehicles],
  );
  const picked = selectable.find((v) => v.id === form.vehicleId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await apiFetch("/api/maintenance", {
        method: "POST",
        body: {
          vehicleId: form.vehicleId,
          type: form.type,
          description: form.description,
          cost: Number(form.cost),
          ...(form.odometerKm ? { odometerKm: Number(form.odometerKm) } : {}),
        },
      });
      toast("Maintenance logged — vehicle moved to shop");
      setForm({ vehicleId: "", type: "OIL_CHANGE", description: "", cost: "0", odometerKm: "" });
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      toast(err instanceof ApiError ? err.message : "Failed to log maintenance", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Log Maintenance" description="This moves the vehicle to In Shop and hides it from dispatch.">
      <form onSubmit={submit} className="space-y-3">
        <Field
          label="Vehicle"
          error={errors.vehicleId}
          hint={
            picked?.status === "ON_TRIP"
              ? "This vehicle is on a trip — complete the trip before servicing it."
              : "Logging a job moves the vehicle to In Shop."
          }
        >
          <VehiclePicker
            vehicles={selectable}
            value={form.vehicleId}
            onChange={(id) => setForm((f) => ({ ...f, vehicleId: id }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Service Type" error={errors.type}>
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} options={enumOptions(MAINTENANCE_TYPE_LABEL)} />
          </Field>
          <Field label="Cost (₹)" error={errors.cost}>
            <Input type="number" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} />
          </Field>
        </div>
        <Field label="Odometer (km)" error={errors.odometerKm}>
          <Input type="number" value={form.odometerKm} onChange={(e) => setForm((f) => ({ ...f, odometerKm: e.target.value }))} placeholder="Optional" />
        </Field>
        <Field label="Description" error={errors.description}>
          <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Oil + filter change, brake inspection" required />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Log & send to shop</Button>
        </div>
      </form>
    </Modal>
  );
}
