"use client";

import * as React from "react";
import { Upload, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET } from "@/lib/constants";

export function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (path: string) => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      onChange(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-card border border-dashed border-border bg-fill px-4 py-6 text-sm text-secondary transition-colors hover:border-ink">
        {value ? (
          <>
            <Check size={16} className="text-success" />
            Image uploaded — choose another to replace
          </>
        ) : (
          <>
            <Upload size={16} />
            {uploading ? "Uploading…" : "Click to upload an image"}
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
          disabled={uploading}
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
