"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [sessionState, setSessionState] = React.useState<
    "checking" | "ready" | "none"
  >("checking");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setSessionState(data.user ? "ready" : "none");
    });
  }, [supabase]);

  const confirmMismatch = confirm.length > 0 && confirm !== password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("Password updated — taking you to your dashboard.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-[-0.6px] text-ink">Stash</h1>
        <p className="mt-2 text-secondary">Set a new password.</p>
      </div>

      <Card elevated>
        {sessionState === "checking" && (
          <p className="text-sm text-secondary">Checking your reset link…</p>
        )}

        {sessionState === "none" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-danger">
              This reset link is invalid or has expired.
            </p>
            <Link
              href="/login"
              className="text-sm font-medium text-accent-strong hover:underline"
            >
              Back to sign in to request a new one
            </Link>
          </div>
        )}

        {sessionState === "ready" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-secondary">
                  New password
                </label>
                <span className="text-xs text-muted">6–72 characters</span>
              </div>
              <Input
                type="password"
                required
                minLength={6}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary">
                Confirm password
              </label>
              <Input
                type="password"
                required
                minLength={6}
                maxLength={72}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                invalid={confirmMismatch}
              />
              {confirmMismatch && (
                <p className="text-sm text-danger">Passwords do not match.</p>
              )}
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
            {message && <p className="text-sm text-success">{message}</p>}

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? "…" : "Update password"}
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
