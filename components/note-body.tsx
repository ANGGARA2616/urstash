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

/**
 * Finds the index of a clicked checkbox within task list items.
 */
function getCheckboxIndex(
  target: HTMLElement,
  container: HTMLElement | null,
): number {
  const checkbox = target.closest<HTMLInputElement>(TASK_CHECKBOX_SELECTOR);
  if (!checkbox || !container) return -1;

  const rendered = Array.from(
    container.querySelectorAll<HTMLInputElement>(TASK_CHECKBOX_SELECTOR),
  );
  return rendered.indexOf(checkbox);
}

/**
 * Toggles the checked status of a checkbox item in the serialized HTML document.
 */
function toggleCheckboxInHtml(rawHtml: string, index: number): string | null {
  const doc = new DOMParser().parseFromString(rawHtml, "text/html");
  const input = doc.body.querySelectorAll<HTMLInputElement>(
    TASK_CHECKBOX_SELECTOR,
  )[index];
  const li = input?.closest("li");
  if (!input || !li) return null;

  const checked = !input.hasAttribute("checked");
  if (checked) {
    input.setAttribute("checked", "checked");
  } else {
    input.removeAttribute("checked");
  }
  li.setAttribute("data-checked", String(checked));
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
    if (savingRef.current) return;

    const index = getCheckboxIndex(
      e.target as HTMLElement,
      containerRef.current,
    );
    if (index === -1) return;

    // Block native uncontrolled toggle — state flows through `body`.
    e.preventDefault();

    const next = toggleCheckboxInHtml(body, index);
    if (!next) return;

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
        className="prose-note text-ink cursor-pointer"
        role="region"
        aria-label="Note task list interactive content"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick(e as unknown as React.MouseEvent);
          }
        }}
        tabIndex={0}
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
