import {
  Link2,
  Wrench,
  Sparkles,
  Image as ImageIcon,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import type { ItemType } from "@/lib/constants";
import type { BadgeTone } from "@/components/ui/badge";
import type {
  Item,
  LinkContent,
  PromptContent,
  ScreenshotContent,
  NoteContent,
} from "@/db/schema";

export const TYPE_META: Record<
  ItemType,
  { label: string; icon: LucideIcon; tone: BadgeTone }
> = {
  link: { label: "Link", icon: Link2, tone: "accent" },
  tool: { label: "Tool", icon: Wrench, tone: "success" },
  prompt: { label: "Prompt", icon: Sparkles, tone: "warning" },
  screenshot: { label: "Screenshot", icon: ImageIcon, tone: "neutral" },
  note: { label: "Note", icon: StickyNote, tone: "neutral" },
};

/** One-line preview text for a card, derived from the type-specific content. */
export function itemSnippet(item: Item): string {
  switch (item.type) {
    case "link":
    case "tool": {
      const c = item.content as LinkContent;
      return c.description || c.url || "";
    }
    case "prompt": {
      const c = item.content as PromptContent;
      return c.promptText || "";
    }
    case "note": {
      const c = item.content as NoteContent;
      return c.body || "";
    }
    case "screenshot": {
      const c = item.content as ScreenshotContent;
      return c.sourceUrl || "";
    }
  }
}
