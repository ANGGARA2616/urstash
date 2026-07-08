import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { distinctTags, listCollections, listItems } from "@/lib/queries";
import { getSignedUrls } from "@/lib/storage";
import { ItemsGrid } from "@/components/items-grid";
import { SearchBar } from "@/components/search-bar";
import { TypeFilter } from "@/components/type-filter";
import { UrlSelect } from "@/components/url-select";
import { FavoriteFilter } from "@/components/favorite-filter";
import { Button } from "@/components/ui/button";
import type { Item, LinkContent, ScreenshotContent } from "@/db/schema";

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Storage path (or absolute URL) of the card thumbnail, if the item has one. */
function previewPath(item: Item): string | undefined {
  if (item.type === "link" || item.type === "tool") {
    return (item.content as LinkContent).screenshotUrl;
  }
  if (item.type === "screenshot") {
    return (item.content as ScreenshotContent).imageUrl;
  }
  return undefined;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sp = await searchParams;

  const filters = {
    q: first(sp.q) ?? null,
    type: first(sp.type) ?? null,
    tag: first(sp.tag) ?? null,
    collection: first(sp.collection) ?? null,
    favorite: first(sp.favorite) === "true",
  };

  const [rows, collections, tags] = await Promise.all([
    listItems(user.id, filters),
    listCollections(user.id),
    distinctTags(user.id),
  ]);

  const paths = rows
    .map((item) => ({ id: item.id, path: previewPath(item) }))
    .filter((p): p is { id: string; path: string } => Boolean(p.path));
  const signed = await getSignedUrls(paths.map((p) => p.path));
  const previews: Record<string, string> = {};
  for (const { id, path } of paths) {
    const url = signed.get(path);
    if (url) previews[id] = url;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-[-0.4px] text-ink">
        Your stash
      </h1>

      <SearchBar />

      <div className="flex flex-wrap items-center gap-3">
        <TypeFilter />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <UrlSelect
            param="tag"
            placeholder="All tags"
            options={tags.map((t) => ({ value: t, label: `#${t}` }))}
          />
          <UrlSelect
            param="collection"
            placeholder="All collections"
            options={collections.map((c) => ({ value: c.id, label: c.name }))}
          />
          <FavoriteFilter />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-border py-20 text-center">
          <p className="text-secondary">
            Nothing here yet. Start capturing what you find.
          </p>
          <Link href="/items/new">
            <Button>Add your first item</Button>
          </Link>
        </div>
      ) : (
        <ItemsGrid
          key={JSON.stringify(filters)}
          items={rows}
          previews={previews}
          collections={collections.map((c) => ({ id: c.id, name: c.name }))}
        />
      )}
    </div>
  );
}
