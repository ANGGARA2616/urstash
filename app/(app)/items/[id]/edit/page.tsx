import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getItem, listCollections } from "@/lib/queries";
import { TYPE_META } from "@/lib/item-types";
import { ItemForm } from "@/components/forms/item-form";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [item, collections] = await Promise.all([
    getItem(user.id, id),
    listCollections(user.id),
  ]);
  if (!item) notFound();

  const m = TYPE_META[item.type];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-[-0.4px] text-ink">
        Edit {m.label.toLowerCase()}
      </h1>
      <div className="mt-6">
        <ItemForm
          type={item.type}
          collections={collections.map((c) => ({ id: c.id, name: c.name }))}
          initial={{
            id: item.id,
            title: item.title,
            tags: item.tags,
            collectionId: item.collectionId,
            isFavorite: item.isFavorite,
            content: item.content as Record<string, unknown>,
          }}
        />
      </div>
    </div>
  );
}
