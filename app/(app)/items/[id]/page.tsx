import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getItem } from "@/lib/queries";
import { getSignedUrl } from "@/lib/storage";
import { TYPE_META } from "@/lib/item-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FavoriteToggle } from "@/components/favorite-toggle";
import { CopyButton } from "@/components/copy-button";
import { DeleteItemButton } from "@/components/delete-item-button";
import type {
  LinkContent,
  NoteContent,
  PromptContent,
  ScreenshotContent,
} from "@/db/schema";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const item = await getItem(user.id, id);
  if (!item) notFound();

  const meta = TYPE_META[item.type];
  const Icon = meta.icon;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard"
        className="text-sm text-secondary hover:text-ink"
      >
        ← Back to stash
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Badge tone={meta.tone}>
            <Icon size={12} />
            {meta.label}
          </Badge>
          <h1 className="text-3xl font-bold tracking-[-0.6px] text-ink">
            {item.title}
          </h1>
        </div>
        <FavoriteToggle id={item.id} isFavorite={item.isFavorite} size={22} />
      </div>

      {item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <Link
              key={t}
              href={`/dashboard?tag=${encodeURIComponent(t)}`}
              className="rounded-pill bg-fill px-2.5 py-0.5 text-xs text-secondary hover:text-ink"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6">
        <ItemBody item={item} />
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Link href={`/items/${item.id}/edit`}>
          <Button variant="secondary">Edit</Button>
        </Link>
        <DeleteItemButton id={item.id} />
      </div>
    </div>
  );
}

async function ItemBody({
  item,
}: {
  item: Awaited<ReturnType<typeof getItem>>;
}) {
  if (!item) return null;

  if (item.type === "link" || item.type === "tool") {
    const c = item.content as LinkContent;
    const shot = c.screenshotUrl ? await getSignedUrl(c.screenshotUrl) : null;
    return (
      <Card className="flex flex-col gap-3">
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 break-all font-medium text-accent-strong hover:underline"
        >
          {c.url}
          <ExternalLink size={14} className="shrink-0" />
        </a>
        {c.description && (
          <p className="whitespace-pre-wrap text-secondary">{c.description}</p>
        )}
        {shot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shot}
            alt={item.title}
            className="mt-1 w-full rounded-panel border border-border"
          />
        )}
      </Card>
    );
  }

  if (item.type === "prompt") {
    const c = item.content as PromptContent;
    return (
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          {c.targetAi ? (
            <Badge tone="neutral">{c.targetAi}</Badge>
          ) : (
            <span />
          )}
          <CopyButton text={c.promptText} label="Copy prompt" />
        </div>
        <pre className="whitespace-pre-wrap rounded-panel bg-fill p-4 font-mono text-sm text-ink">
          {c.promptText}
        </pre>
      </Card>
    );
  }

  if (item.type === "screenshot") {
    const c = item.content as ScreenshotContent;
    const src = await getSignedUrl(c.imageUrl);
    return (
      <Card className="flex flex-col gap-3">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={item.title}
            className="w-full rounded-panel border border-border"
          />
        ) : (
          <p className="text-muted">Image unavailable.</p>
        )}
        {c.sourceUrl && (
          <a
            href={c.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-accent-strong hover:underline"
          >
            Source
            <ExternalLink size={13} />
          </a>
        )}
      </Card>
    );
  }

  // note
  const c = item.content as NoteContent;
  return (
    <Card>
      <p className="whitespace-pre-wrap leading-relaxed text-ink">{c.body}</p>
    </Card>
  );
}
