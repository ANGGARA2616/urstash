"use client";

import * as React from "react";

const TASK_CHECKBOX_SELECTOR =
  'ul[data-type="taskList"] input[type="checkbox"]';

/**
 * Renders an HTML note body and lets task-list checkboxes be toggled from the
 * read view, persisting the updated HTML via PATCH /api/items/[id].
 */
/**
 * Sanitizes HTML content before rendering to mitigate Cross-Site Scripting (XSS).
 * Removes script tags, plugins, and inline event handlers.
 */
function sanitizeHtml(rawHtml: string): string {
  if (typeof window === "undefined") return rawHtml;
  const doc = new DOMParser().parseFromString(rawHtml, "text/html");
  const dangerous = doc.querySelectorAll("script, iframe, object, embed");
  dangerous.forEach((el) => el.remove());
  const allElements = doc.querySelectorAll("*");
  allElements.forEach((el) => {
    for (let i = el.attributes.length - 1; i >= 0; i--) {
      const attr = el.attributes[i];
      if (
        attr.name.toLowerCase().startsWith("on") ||
        attr.value.trim().toLowerCase().startsWith("javascript:")
      ) {
        el.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.innerHTML;
}

export function NoteBody({
  id,
  initialBody,
}: {
  id: string;
  initialBody: string;
}) {
  const [body, setBody] = React.useState(initialBody);
  const [error, setError] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const savingRef = React.useRef(false);

  async function handleClick(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    const checkbox = target.closest<HTMLInputElement>(TASK_CHECKBOX_SELECTOR);
    if (!checkbox || !containerRef.current) return;

    // Block the native uncontrolled toggle — state flows through `body`.
    e.preventDefault();
    if (savingRef.current) return;

    const rendered = Array.from(
      containerRef.current.querySelectorAll<HTMLInputElement>(
        TASK_CHECKBOX_SELECTOR,
      ),
    );
    const index = rendered.indexOf(checkbox);
    if (index === -1) return;

    // Toggle in the source string, not the live DOM, so the persisted HTML
    // stays exactly what TipTap will re-parse on the edit page.
    const doc = new DOMParser().parseFromString(body, "text/html");
    const input = doc.body.querySelectorAll<HTMLInputElement>(
      TASK_CHECKBOX_SELECTOR,
    )[index];
    const li = input?.closest("li");
    if (!input || !li) return;

    const checked = !input.hasAttribute("checked");
    if (checked) input.setAttribute("checked", "checked");
    else input.removeAttribute("checked");
    // TipTap's TaskItem reads data-checked when re-opening the editor.
    li.setAttribute("data-checked", String(checked));

    const next = doc.body.innerHTML;
    const prev = body;
    setBody(next);
    setError(false);

    savingRef.current = true;
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: { body: next, format: "html" } }),
      });
      if (!res.ok) {
        setBody(prev);
        setError(true);
      }
    } catch {
      setBody(prev);
      setError(true);
    } finally {
      savingRef.current = false;
    }
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="prose-note text-ink"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
      />
      {error && (
        <p className="mt-2 text-sm text-danger">
          Could not save the checkbox change. Try again.
        </p>
      )}
    </div>
  );
}
