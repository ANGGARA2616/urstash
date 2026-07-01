"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (mode === "signup") {
      setMessage(
        "Account created. If email confirmation is on, check your inbox — otherwise sign in below.",
      );
      setMode("signin");
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
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
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
        <form onSubmit={handlePassword} className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-secondary">
              Password
            </label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {message && <p className="text-sm text-success">{message}</p>}

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            className="font-medium text-accent-strong hover:underline"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setMessage(null);
            }}
          >
            {mode === "signin" ? "Create an account" : "Have an account? Sign in"}
          </button>
          <button
            type="button"
            className="text-secondary hover:text-ink disabled:opacity-50"
            onClick={handleMagicLink}
            disabled={loading}
          >
            Email me a magic link
          </button>
        </div>
      </Card>
    </main>
  );
}
