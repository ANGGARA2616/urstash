"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateCollectionForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setCreating(false);
    if (res.ok) {
      setName("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={create} className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New collection name"
        className="max-w-xs"
      />
      <Button type="submit" disabled={creating || !name.trim()}>
        {creating ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
