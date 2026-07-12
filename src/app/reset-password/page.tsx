"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { apiFetch, ApiError } from "@/lib/client/api";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    if (password !== confirm) {
      setErrors({ confirm: "Passwords do not match" });
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/auth/reset", { method: "POST", body: { token, password } });
      setDone(true);
      setTimeout(() => router.push("/login"), 2200);
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      }
      setError(err instanceof ApiError ? err.message : "Could not reset your password");
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <>
        <h1 className="text-xl font-semibold text-fg">Invalid reset link</h1>
        <p className="mt-2 text-sm text-muted">
          This link is missing its token. Request a new one from the forgot-password page.
        </p>
        <Link href="/forgot-password" className="mt-6 inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
          <ArrowLeft className="size-3.5" /> Request a new link
        </Link>
      </>
    );
  }

  if (done) {
    return (
      <>
        <div className="grid size-10 place-items-center rounded-[3px] border border-available/35 bg-available/10 text-available">
          <CheckCircle2 className="size-5" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-fg">Password updated</h1>
        <p className="mt-2 text-sm text-muted">
          Your account is also unlocked. Redirecting you to sign in…
        </p>
      </>
    );
  }

  return (
    <>
      <p className="label-tech">Account Recovery</p>
      <h1 className="mt-2 text-xl font-semibold text-fg">Choose a new password</h1>
      <p className="mt-1.5 text-xs text-muted">This also clears any lockout on your account.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="New password" error={errors.password} hint="Min 8 characters, with a letter and a number.">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
          />
        </Field>

        {error && (
          <div className="rounded-[3px] border border-danger/35 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Update password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="skeleton h-40 rounded-[3px]" />}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
