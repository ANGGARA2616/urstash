import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listCollections } from "@/lib/queries";
import { ITEM_TYPES, type ItemType } from "@/lib/constants";
import { TYPE_META } from "@/lib/item-types";
import { ItemForm } from "@/components/forms/item-form";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { type } = await searchParams;
  const collections = await listCollections(user.id);

  const valid =
    type && (ITEM_TYPES as readonly string[]).includes(type)
      ? (type as ItemType)
      : null;

  if (!valid) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold tracking-[-0.4px] text-ink">
          New item
        </h1>
        <p className="mt-1 text-secondary">What are you saving?</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ITEM_TYPES.map((t) => {
            const m = TYPE_META[t];
            const Icon = m.icon;
            return (
              <Link
                key={t}
                href={`/items/new?type=${t}`}
                className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface p-6 text-center transition-shadow hover:shadow-soft"
              >
                <Icon size={24} className="text-ink" />
                <span className="text-sm font-medium text-ink">{m.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const m = TYPE_META[valid];
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-[-0.4px] text-ink">
        New {m.label.toLowerCase()}
      </h1>
      <div className="mt-6">
        <ItemForm
          type={valid}
          collections={collections.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </div>
  );
}
