# PRD — Stash (Personal Knowledge Vault)

> **Note:** "Stash" is a working title, not final. Alternatives to consider later: Kotak, Vault, Cantrip.

## 1. Overview

**Problem statement**
Anggara constantly discovers useful things while working — tools, tips, prompts, URLs, design references, UI screenshots — but has no single place to save them that's both fast to capture into and easy to search later. Notes end up scattered across bookmarks, chat history, and memory.

**Vision**
A personal archive that captures anything with minimal friction and makes it trivially easy to find again later — a "second brain" for reusable resources, not a note-taking app.

**Primary user**
Anggara himself (v1). Built API-first so it can later support multiple users without a rewrite, but v1 ships as single-user.

## 2. Goals & Non-Goals

**Goals (v1)**
- Capture any item (link, prompt, tool, screenshot, note) in one click, from the browser
- Search/browse everything from one place
- Own the data — exportable, no lock-in

**Non-goals (v1)**
- Team/multi-user collaboration or sharing
- Public collections
- Native mobile app
- Full-page scrolling screenshots (viewport capture is enough for v1)
- Semantic/AI search (planned for Phase 3, not required for launch)

## 3. Scope & Phases

| Phase | Deliverable |
|---|---|
| **Phase 0** | Web app: auth, manual CRUD for items, list view, basic full-text search |
| **Phase 1** | Chrome extension: one-click capture of current tab (title, URL, screenshot, selection) |
| **Phase 2** | AI auto-tagging & summary generation via Claude API on capture |
| **Phase 3** | Semantic search via pgvector, once the collection is large enough to need it |

MVP = Phase 0 + Phase 1. Phases 2–3 are explicitly deferred; don't build them into the initial schema/UI unless trivial to leave room for.

## 4. User Stories (Phase 0 + 1)

- As a user, I can save a link from any webpage in one click via the extension, with title/URL/screenshot auto-filled.
- As a user, I can save a prompt I wrote (e.g. a Claude Code prompt) with a target-AI tag, so I can reuse it later.
- As a user, I can save a plain note or tip without needing a URL.
- As a user, I can add free-form tags to an item, or skip tagging entirely and do it later.
- As a user, I can organize items into collections (optional, not mandatory).
- As a user, I can search across all items by keyword and filter by type/tag/collection.
- As a user, I can mark an item as favorite for quick access.
- As a user, I can export all my data as JSON at any time.

## 5. Data Model

Single `items` table with a `type` discriminator and a flexible `content` JSON column for type-specific fields — avoids a table-per-type explosion while staying queryable.

```typescript
// Drizzle schema (Postgres via Supabase)

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  type: text('type', {
    enum: ['link', 'prompt', 'tool', 'screenshot', 'note'],
  }).notNull(),
  title: text('title').notNull(),
  content: jsonb('content').notNull(), // type-specific payload, see below
  tags: text('tags').array().default([]),
  collectionId: uuid('collection_id').references(() => collections.id),
  isFavorite: boolean('is_favorite').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const accessTokens = pgTable('access_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  tokenHash: text('token_hash').notNull(), // hashed, never store raw
  label: text('label'), // e.g. "Chrome extension"
  createdAt: timestamp('created_at').defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
});
```

**`content` shape per type:**

| type | content fields |
|---|---|
| `link` / `tool` | `{ url, favicon?, screenshotUrl?, description? }` |
| `prompt` | `{ promptText, targetAi?, variables? }` |
| `screenshot` | `{ imageUrl, sourceUrl?, styleTags? }` |
| `note` | `{ body }` (markdown) |

## 6. Architecture

- **Frontend:** Next.js (App Router) + Tailwind
- **Backend:** Next.js route handlers, acting as the single API both the web app and extension call
- **Database:** Supabase Postgres, with `user_id` on every table from day one (even single-user) so multi-tenancy later is a config change, not a migration
- **Storage:** Supabase Storage for screenshots/uploaded images
- **ORM:** Drizzle
- **Auth (web):** Supabase Auth (email/password or magic link)
- **Auth (extension):** Personal Access Token, generated from the web app, hashed and stored in `access_tokens`, sent as a Bearer header. Avoids dealing with session refresh inside a browser extension.
- **Extension:** Manifest V3, capture screenshot client-side via `chrome.tabs.captureVisibleTab` (no external screenshot API needed for viewport capture — cheaper and faster)

```
[Extension popup] ─┐
                    ├─> [Next.js API routes] ─> [Supabase Postgres + Storage]
[Web app] ──────────┘
```

## 7. Non-Functional Requirements

- **Data ownership:** full JSON export must be available at any time — this is a personal archive, lock-in defeats the purpose
- **Capture speed:** saving an item from the extension should take one click for the default case (no required fields beyond what's auto-filled)
- **Search latency:** should feel instant for the expected v1 scale (hundreds to low thousands of items) — Postgres full-text search is sufficient, no need for a search service yet

## 8. Known Gotchas (relevant to this stack)

- Supabase RLS can silently block reads/writes without throwing an obvious error — verify policies early with a real query, not just in the dashboard.
- Next.js 16 renamed `middleware.ts` to `proxy.ts` — check which convention the installed version expects before writing auth middleware.
- Tailwind v4 uses `@theme` in CSS instead of `tailwind.config.js` — don't reach for the old config pattern out of habit.

## 9. Out of Scope for v1

- Semantic search / embeddings (Phase 3)
- AI auto-tagging (Phase 2)
- Full-page screenshot capture
- Firefox/Safari extension (Chrome only for v1)
- Public/shared collections, team accounts
- Native mobile app

## 10. Open Decisions

- Final app name
- Whether tags stay as a simple `text[]` column (current plan) or move to a relational tags table if faceted filtering becomes important later
- Whether Phase 1 extension also needs a right-click "save selection/image" context menu, or just full-tab capture is enough for launch
