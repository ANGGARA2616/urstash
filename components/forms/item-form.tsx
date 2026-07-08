"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ItemType } from "@/lib/constants";
import { TYPE_META } from "@/lib/item-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/tag-input";
import { ImageUpload } from "@/components/image-upload";
import { NoteEditor } from "@/components/forms/note-editor";

type CollectionOption = { id: string; name: string };

export type ItemFormInitial = {
  id: string;
  title: string;
  tags: string[];
  collectionId: string | null;
  isFavorite: boolean;
  content: Record<string, unknown>;
};

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-secondary">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function ItemForm({
  type,
  collections,
  initial,
}: {
  type: ItemType;
  collections: CollectionOption[];
  initial?: ItemFormInitial;
}) {
  const router = useRouter();
  const c = (initial?.content ?? {}) as Record<string, string | undefined>;

  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [tags, setTags] = React.useState<string[]>(initial?.tags ?? []);
  const [collectionId, setCollectionId] = React.useState(
    initial?.collectionId ?? "",
  );

  // Type-specific fields.
  const [url, setUrl] = React.useState(c.url ?? "");
  const [description, setDescription] = React.useState(c.description ?? "");
  const [promptText, setPromptText] = React.useState(c.promptText ?? "");
  const [targetAi, setTargetAi] = React.useState(c.targetAi ?? "");
  const [imageUrl, setImageUrl] = React.useState(c.imageUrl ?? "");
  const [sourceUrl, setSourceUrl] = React.useState(c.sourceUrl ?? "");
  const [body, setBody] = React.useState(c.body ?? "");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function buildContent(): Record<string, unknown> {
    switch (type) {
      case "link":
      case "tool":
        return { url, ...(description ? { description } : {}) };
      case "prompt":
        return { promptText, ...(targetAi ? { targetAi } : {}) };
      case "screenshot":
        return { imageUrl, ...(sourceUrl ? { sourceUrl } : {}) };
      case "note":
        return { body, format: "html" };
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // The rich text editor has no native `required`; an empty document
    // serializes as e.g. "<p></p>", so check the text content instead.
    if (type === "note" && body.replace(/<[^>]*>/g, "").trim() === "") {
      setError("Note can't be empty.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      type,
      title,
      content: buildContent(),
      tags,
      collectionId: collectionId || null,
    };

    const res = initial
      ? await fetch(`/api/items/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content: payload.content,
            tags,
            collectionId: collectionId || null,
          }),
        })
      : await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong.");
      return;
    }
    const data = await res.json();
    const id = initial?.id ?? data.item?.id;
    router.push(id ? `/items/${id}` : "/dashboard");
    router.refresh();
  }

  const meta = TYPE_META[type];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Title">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder={`Name this ${meta.label.toLowerCase()}`}
        />
      </Field>

      {(type === "link" || type === "tool") && (
        <>
          <Field label="URL">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://…"
            />
          </Field>
          <Field label="Description" hint="Optional">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this and why did you save it?"
            />
          </Field>
        </>
      )}

      {type === "prompt" && (
        <>
          <Field
            label="Prompt"
            hint="Use {{variable}} placeholders — they become fill-in fields on the detail page"
          >
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              required
              rows={6}
              className="font-mono text-sm"
              placeholder="Paste the prompt…"
            />
          </Field>
          <Field label="Target AI" hint="Optional — e.g. Claude, ChatGPT, Midjourney">
            <Input
              value={targetAi}
              onChange={(e) => setTargetAi(e.target.value)}
              placeholder="Claude"
            />
          </Field>
        </>
      )}

      {type === "screenshot" && (
        <>
          <Field label="Image">
            <ImageUpload value={imageUrl} onChange={setImageUrl} />
          </Field>
          <Field label="Source URL" hint="Optional — where the screenshot is from">
            <Input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
        </>
      )}

      {type === "note" && (
        <Field label="Note">
          <NoteEditor
            value={body}
            format={c.format === "html" ? "html" : undefined}
            onChange={setBody}
          />
        </Field>
      )}

      <Field label="Tags">
        <TagInput value={tags} onChange={setTags} />
      </Field>

      {collections.length > 0 && (
        <Field label="Collection" hint="Optional">
          <select
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            className="w-full rounded-pill border border-border bg-fill px-4 py-2.5 text-base text-ink outline-none transition-colors focus:border-ink focus:bg-surface"
          >
            <option value="">None</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Saving…" : initial ? "Save changes" : "Save item"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
