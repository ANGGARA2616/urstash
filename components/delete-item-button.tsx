"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteItemButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this item? This can't be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setDeleting(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={deleting}
      className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger-tint disabled:opacity-50"
    >
      <Trash2 size={14} />
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
