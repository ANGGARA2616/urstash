import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, de-duping conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves the base application URL for auth redirects.
 * Prioritizes NEXT_PUBLIC_SITE_URL, falls back to window.location.origin in the browser,
 * and defaults to http://localhost:3000 for local development.
 */
export function getURL(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "http://localhost:3000");

  url = url.replace(/\/+$/, "");
  return url;
}
