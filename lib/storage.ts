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
