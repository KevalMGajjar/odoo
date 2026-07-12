"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldAlert, Wrench, Route, ShieldCheck, BarChart3 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { apiFetch, ApiError } from "@/lib/client/api";
import { cn } from "@/lib/utils";

const ROLES = [
  { key: "FLEET_MANAGER", label: "Fleet Manager", desc: "Vehicles, maintenance, users", icon: Wrench },
  { key: "DRIVER", label: "Driver", desc: "Create & dispatch trips", icon: Route },
  { key: "SAFETY_OFFICER", label: "Safety Officer", desc: "Licences & safety scores", icon: ShieldCheck },
  { key: "FINANCIAL_ANALYST", label: "Financial Analyst", desc: "Fuel, cost & analytics", icon: BarChart3 },
] as const;

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [role, setRole] = useState<string>("DRIVER");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});
    setLoading(true);
    try {
      await apiFetch("/api/auth/signup", { method: "POST", body: { ...form, role } });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      }
      setError(err instanceof ApiError ? err.message : "Could not create account");
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <p className="label-tech">New Account</p>
      <h1 className="mt-2 text-xl font-semibold text-fg">Create your account</h1>
      <p className="mt-1.5 text-xs text-muted">Your role determines what you can access.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Full name" error={errors.name}>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Kavish Shah" required />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" required />
        </Field>
        <Field label="Password" error={errors.password} hint="Min 8 characters, with a letter and a number.">
          <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" required />
        </Field>

        {/* Role selection — RBAC at registration */}
        <div>
          <p className="label-tech mb-1.5">Role</p>
          <div className="grid grid-cols-2 gap-1.5">
            {ROLES.map((r) => {
              const active = role === r.key;
              const Icon = r.icon;
              return (
                <button
                  type="button"
                  key={r.key}
                  onClick={() => setRole(r.key)}
                  className={cn(
                    "rounded-[3px] border px-2.5 py-2 text-left transition-colors",
                    active
                      ? "border-accent bg-accent/10"
                      : "border-line bg-panel-2 hover:border-line-strong",
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Icon className={cn("size-3.5", active ? "text-accent" : "text-muted")} />
                    <span className="text-xs font-medium text-fg">{r.label}</span>
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-tight text-muted">{r.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-[3px] border border-danger/35 bg-danger/10 px-3 py-2 text-xs text-danger">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Create account <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
