"use client";

import * as React from "react";
import { X } from "lucide-react";

export function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = React.useState("");

  function add(raw: string) {
    const t = raw.trim().replace(/^#/, "");
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
  }

  function remove(t: string) {
    onChange(value.filter((x) => x !== t));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
      setDraft("");
    } else if (e.key === "Backspace" && !draft && value.length) {
      remove(value[value.length - 1]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-card border border-border bg-fill px-3 py-2">
      {value.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-pill border border-border bg-surface px-2 py-0.5 text-sm text-ink"
        >
          #{t}
          <button
            type="button"
            onClick={() => remove(t)}
            className="text-muted hover:text-danger"
            aria-label={`Remove ${t}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          add(draft);
          setDraft("");
        }}
        placeholder={value.length ? "" : "Add tags — Enter to add"}
        className="min-w-[100px] flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
      />
    </div>
  );
}
