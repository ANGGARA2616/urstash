import Link from "next/link";
import { redirect } from "next/navigation";
import { Folder } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { listCollections } from "@/lib/queries";
import { CreateCollectionForm } from "@/components/create-collection-form";

export default async function CollectionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const collections = await listCollections(user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-[-0.4px] text-ink">
          Collections
        </h1>
      </div>

      <CreateCollectionForm />

      {collections.length === 0 ? (
        <p className="rounded-card border border-dashed border-border py-16 text-center text-secondary">
          No collections yet. Create one to group related items.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {collections.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard?collection=${c.id}`}
                className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 transition-shadow hover:shadow-soft"
              >
                <Folder size={18} className="text-secondary" />
                <span className="font-medium text-ink">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
