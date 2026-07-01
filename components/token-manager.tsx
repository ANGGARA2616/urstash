"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";

export type TokenRow = {
  id: string;
  label: string | null;
  createdAt: string | null;
  lastUsedAt: string | null;
};

export function TokenManager({ initial }: { initial: TokenRow[] }) {
  const router = useRouter();
  const [label, setLabel] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [newToken, setNewToken] = React.useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() || undefined }),
    });
    setCreating(false);
    if (res.ok) {
      const data = await res.json();
      setNewToken(data.token);
      setLabel("");
      router.refresh();
    }
  }

  async function revoke(id: string) {
    if (!window.confirm("Revoke this token? Any client using it will stop working."))
      return;
    const res = await fetch(`/api/tokens/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={create} className="flex items-center gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (e.g. Chrome extension)"
          className="max-w-xs"
        />
        <Button type="submit" disabled={creating}>
          {creating ? "Generating…" : "Generate token"}
        </Button>
      </form>

      {newToken && (
        <div className="flex flex-col gap-2 rounded-card border border-accent-tint bg-accent-tint/40 p-4">
          <p className="text-sm font-medium text-ink">
            Copy this token now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-pill bg-surface px-3 py-2 font-mono text-sm text-ink">
              {newToken}
            </code>
            <CopyButton text={newToken} />
          </div>
        </div>
      )}

      {initial.length === 0 ? (
        <p className="text-sm text-muted">No access tokens yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {initial.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <KeyRound size={16} className="text-secondary" />
                <div>
                  <p className="text-sm font-medium text-ink">
                    {t.label || "Untitled token"}
                  </p>
                  <p className="text-xs text-muted">
                    Created {t.createdAt ?? "—"}
                    {t.lastUsedAt ? ` · last used ${t.lastUsedAt}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => revoke(t.id)}
                className="rounded-full p-1.5 text-muted transition-colors hover:bg-danger-tint hover:text-danger"
                aria-label="Revoke token"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
