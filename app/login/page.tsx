"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getURL } from "@/lib/utils";

type Mode = "signin" | "signup" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [mode, setMode] = React.useState<Mode>("signin");
  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "auth") {
      setError("Sign-in link was invalid or expired. Request a new one.");
    }
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setUsername("");
    setConfirmPassword("");
    setError(null);
    setMessage(null);
  }

  const confirmMismatch =
    confirmPassword.length > 0 && confirmPassword !== password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    if (mode === "forgot") {
      const siteUrl = getURL();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/auth/reset-password`,
      });
      setLoading(false);
      if (error) {
        setError(
          error.status === 429
            ? "Too many requests — wait a minute and try again."
            : error.message,
        );
        return;
      }
      setMessage("Reset link sent — check your email.");
      return;
    }

    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { username: username.trim() } },
          });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (mode === "signup") {
      switchMode("signin");
      setMessage(
        "Account created. If email confirmation is on, check your inbox — otherwise sign in below.",
      );
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    const siteUrl = getURL();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("Magic link sent — check your email.");
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-[-0.6px] text-ink">Stash</h1>
        <p className="mt-2 text-secondary">Your personal knowledge vault.</p>
      </div>

      <Card elevated>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-secondary">
                Username
              </label>
              <Input
                type="text"
                required
                maxLength={40}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your display name"
                autoComplete="nickname"
              />
            </div>
          )}
          {mode !== "forgot" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-secondary">
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    className="text-sm text-secondary hover:text-ink"
                    onClick={() => switchMode("forgot")}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                type="password"
                required
                minLength={6}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
              />
            </div>
          )}
          {mode === "signup" && (
          <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-secondary">
                  Confirm password
                </label>
                <span className="text-xs text-muted">6–72 characters</span>
              </div>
              <Input
                type="password"
                required
                minLength={6}
                maxLength={72}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                invalid={confirmMismatch}
              />
              {confirmMismatch && (
                <p className="text-sm text-danger">Passwords do not match.</p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
          {message && <p className="text-sm text-success">{message}</p>}

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading
              ? "…"
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            className="font-medium text-accent-strong hover:underline"
            onClick={() =>
              switchMode(mode === "signin" ? "signup" : "signin")
            }
          >
            {mode === "signin"
              ? "Create an account"
              : mode === "signup"
                ? "Have an account? Sign in"
                : "Back to sign in"}
          </button>
          {mode !== "forgot" && (
            <button
              type="button"
              className="text-secondary hover:text-ink disabled:opacity-50"
              onClick={handleMagicLink}
              disabled={loading}
            >
              Email me a magic link
            </button>
          )}
        </div>
      </Card>
    </main>
  );
}
