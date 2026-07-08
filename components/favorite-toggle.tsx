"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function FavoriteToggle({
  id,
  isFavorite,
  size = 18,
}: {
  id: string;
  isFavorite: boolean;
  size?: number;
}) {
  const router = useRouter();
  const [fav, setFav] = React.useState(isFavorite);
  const [pending, startTransition] = React.useTransition();

  async function toggle(e: React.MouseEvent) {
    // Card is wrapped in a link — don't navigate when starring.
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next);
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: next }),
    });
    if (!res.ok) {
      setFav(!next);
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "rounded-full p-1.5 transition-colors hover:bg-fill",
        fav ? "text-star" : "text-muted",
      )}
    >
      <Star size={size} fill={fav ? "currentColor" : "none"} />
    </button>
  );
}
