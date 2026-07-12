"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { apiFetch, ApiError } from "@/lib/client/api";

const DEMO = [
  { label: "Kavish", role: "Fleet Manager", email: "kavish@gmail.com" },
  { label: "Vatsal", role: "Driver", email: "vatsal@gmail.com" },
  { label: "Harsh", role: "Safety Officer", email: "harsh@gmail.com" },
  { label: "Keval", role: "Financial Analyst", email: "keval@gmail.com" },
];
const DEMO_PASSWORD = "Transit@2026";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e?: React.FormEvent, creds?: { email: string; password: string }) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: { ...(creds ?? { email, password }), rememberMe },
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <p className="label-tech">Secure Access</p>
      <h1 className="mt-2 text-xl font-semibold text-fg">Sign in to TransitOps</h1>
      <p className="mt-1.5 text-xs text-muted">
        Accounts lock for 15 minutes after 5 failed attempts.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-3.5 accent-[var(--accent)]"
            />
            Remember me for 30 days
          </label>
          <Link href="/forgot-password" className="text-xs text-accent hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-[3px] border border-danger/35 bg-danger/10 px-3 py-2 text-xs text-danger">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Sign In <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted">
        No account?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Create one
        </Link>
      </p>

      {/* Demo accounts */}
      <div className="mt-7 border-t border-line pt-5">
        <p className="label-tech mb-2.5">Demo Accounts</p>
        <div className="grid grid-cols-2 gap-1.5">
          {DEMO.map((d) => (
            <button
              key={d.email}
              onClick={() => {
                setEmail(d.email);
                setPassword(DEMO_PASSWORD);
                submit(undefined, { email: d.email, password: DEMO_PASSWORD });
              }}
              disabled={loading}
              className="rounded-[3px] border border-line bg-panel-2 px-2.5 py-2 text-left transition-colors hover:border-accent/50 disabled:opacity-50"
            >
              <span className="block text-xs font-medium text-fg">{d.label}</span>
              <span className="label-tech mt-0.5 block">{d.role}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
