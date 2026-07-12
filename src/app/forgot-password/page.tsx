"use client";
import { useState } from "react";
import Link from "next/link";
import { MailCheck, ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { apiFetch, ApiError } from "@/lib/client/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/forgot", { method: "POST", body: { email } });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the reset email");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell>
        <div className="grid size-10 place-items-center rounded-[3px] border border-available/35 bg-available/10 text-available">
          <MailCheck className="size-5" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-fg">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          If an account exists for <span className="text-fg">{email}</span>, we&apos;ve sent a reset
          link. It expires in 60 minutes.
        </p>
        <Link href="/login" className="mt-6 inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
          <ArrowLeft className="size-3.5" /> Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <p className="label-tech">Account Recovery</p>
      <h1 className="mt-2 text-xl font-semibold text-fg">Forgot your password?</h1>
      <p className="mt-1.5 text-xs text-muted">
        Enter your email and we&apos;ll send you a link to choose a new one.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </Field>

        {error && (
          <div className="rounded-[3px] border border-danger/35 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Send reset link
        </Button>
      </form>

      <Link href="/login" className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg">
        <ArrowLeft className="size-3.5" /> Back to sign in
      </Link>
    </AuthShell>
  );
}
