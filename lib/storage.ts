import { createClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET } from "@/lib/constants";

/**
 * Resolve a stored media path to a temporary signed URL.
 * Pass-through for already-absolute URLs (e.g. an external image the user pasted).
 */
export async function getSignedUrl(
  path: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/**
 * Resolve many stored media paths to signed URLs in a single request.
 * Absolute URLs pass through; failed entries are omitted from the map.
 */
export async function getSignedUrls(
  paths: string[],
  expiresIn = 3600,
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const storagePaths: string[] = [];

  for (const path of new Set(paths)) {
    if (/^https?:\/\//.test(path)) resolved.set(path, path);
    else storagePaths.push(path);
  }
  if (storagePaths.length === 0) return resolved;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(storagePaths, expiresIn);
  if (error || !data) return resolved;

  for (const entry of data) {
    if (!entry.error && entry.path && entry.signedUrl) {
      resolved.set(entry.path, entry.signedUrl);
    }
  }
  return resolved;
}
