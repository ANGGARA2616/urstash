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
