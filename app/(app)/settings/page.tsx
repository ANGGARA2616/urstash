import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listTokens } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { TokenManager } from "@/components/token-manager";

function fmt(d: Date | null): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString();
}

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const tokens = await listTokens(user.id);
  const rows = tokens.map((t) => ({
    id: t.id,
    label: t.label,
    createdAt: fmt(t.createdAt),
    lastUsedAt: fmt(t.lastUsedAt),
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <h1 className="text-2xl font-bold tracking-[-0.4px] text-ink">Settings</h1>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Export your data</h2>
          <p className="text-sm text-secondary">
            Download everything as JSON — you own your archive, no lock-in.
          </p>
        </div>
        <a href="/api/export" className="btn btn-primary btn-md self-start">
          <span className="btn-label">
            <Download size={16} /> Export JSON
          </span>
        </a>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Access tokens</h2>
          <p className="text-sm text-secondary">
            For the browser extension (Phase 1). Sent as a{" "}
            <code className="font-mono text-xs">Bearer</code> header; only the
            hash is stored.
          </p>
        </div>
        <Card>
          <TokenManager initial={rows} />
        </Card>
      </section>
    </div>
  );
}
