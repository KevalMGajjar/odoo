"use client";
import { useEffect, useState } from "react";
import type { LicenseCategory, DriverStatus } from "@prisma/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { apiFetch, ApiError } from "@/lib/client/api";
import { DriverLicense3D } from "@/components/DriverLicense3D";
import { LICENSE_LABEL, DRIVER_STATUS_META, enumOptions } from "@/lib/display";
import type { Driver } from "@/lib/types";

type FormState = {
  name: string;
  licenseNo: string;
  licenseCategory: LicenseCategory;
  licenseExpiry: string;
  contact: string;
  safetyScore: string;
  status: DriverStatus;
};

const empty: FormState = {
  name: "",
  licenseNo: "",
  licenseCategory: "LMV",
  licenseExpiry: "",
  contact: "",
  safetyScore: "100",
  status: "AVAILABLE",
};

export function DriverFormModal({
  open,
  onClose,
  onSaved,
  driver,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  driver: Driver | null;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setErrors({});
      setForm(
        driver
          ? {
              name: driver.name,
              licenseNo: driver.licenseNo,
              licenseCategory: driver.licenseCategory,
              licenseExpiry: driver.licenseExpiry.slice(0, 10),
              contact: driver.contact,
              safetyScore: String(driver.safetyScore),
              status: driver.status,
            }
          : empty,
      );
    }
  }, [open, driver]);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        name: form.name,
        licenseNo: form.licenseNo,
        licenseCategory: form.licenseCategory,
        licenseExpiry: form.licenseExpiry,
        contact: form.contact,
        safetyScore: Number(form.safetyScore),
        ...(driver ? { status: form.status } : {}),
      };
      if (driver) {
        await apiFetch(`/api/drivers/${driver.id}`, { method: "PATCH", body: payload });
        toast(`${form.name} updated`);
      } else {
        await apiFetch("/api/drivers", { method: "POST", body: payload });
        toast(`${form.name} added`);
      }
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      toast(err instanceof ApiError ? err.message : "Failed to save driver", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={driver ? "Edit Driver" : "Add Driver"} description="The licence preview updates live and pauses on hover." size="xl">
      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        {/* Live 3D licence */}
        <div className="flex items-center justify-center rounded-xl border border-line bg-bg/50">
          <DriverLicense3D
            name={form.name}
            licenseNo={form.licenseNo}
            category={form.licenseCategory}
            expiry={form.licenseExpiry}
            contact={form.contact}
            safetyScore={Number(form.safetyScore) || 0}
          />
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-3">
          <Field label="Full Name" error={errors.name}>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Alex D'Souza" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Licence Number" error={errors.licenseNo}>
              <Input value={form.licenseNo} onChange={(e) => set("licenseNo", e.target.value)} placeholder="DL-MH-2019-0001" required />
            </Field>
            <Field label="Category" error={errors.licenseCategory}>
              <Select value={form.licenseCategory} onChange={(e) => set("licenseCategory", e.target.value)} options={enumOptions(LICENSE_LABEL)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Licence Expiry" error={errors.licenseExpiry}>
              <Input type="date" value={form.licenseExpiry} onChange={(e) => set("licenseExpiry", e.target.value)} required />
            </Field>
            <Field label="Contact Number" error={errors.contact}>
              <Input value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="+91 98200 11223" required />
            </Field>
          </div>
          <Field label={`Safety Score — ${form.safetyScore}`} error={errors.safetyScore}>
            <input
              type="range"
              min={0}
              max={100}
              value={form.safetyScore}
              onChange={(e) => set("safetyScore", e.target.value)}
              className="w-full accent-[var(--color-accent)]"
            />
          </Field>
          {driver && (
            <Field label="Status" error={errors.status}>
              <Select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                options={Object.entries(DRIVER_STATUS_META).map(([v, m]) => ({ value: v, label: m.label }))}
              />
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>{driver ? "Save changes" : "Add driver"}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
