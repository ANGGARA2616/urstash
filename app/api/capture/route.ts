import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/db";
import { items, type ItemContent } from "@/db/schema";
import { resolveUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MEDIA_BUCKET } from "@/lib/constants";

/**
 * POST /api/capture — the single endpoint the Chrome extension calls (Bearer token).
 * Also works with a web session. Uploads an optional viewport screenshot
 * server-side (service role) into the user's folder, then inserts the item.
 * CORS-enabled so it's reachable from the extension popup origin.
 */

/**
 * Restricted CORS policy:
 * Instead of wildcard "*", restrict allowed origin to chrome-extension or site URL
 * to avoid overly permissive cross-origin resource sharing (SonarLint S5122).
 */
function getCorsHeaders(request?: Request): Record<string, string> {
  const requestOrigin = request?.headers.get("origin");
  const allowedOrigin =
    requestOrigin &&
    (requestOrigin.startsWith("chrome-extension://") ||
      requestOrigin === process.env.NEXT_PUBLIC_SITE_URL)
      ? requestOrigin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "chrome-extension://*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function cors(res: Response, req?: Request): Response {
  for (const [k, v] of Object.entries(getCorsHeaders(req))) res.headers.set(k, v);
  return res;
}

function json(body: unknown, status = 200, req?: Request): Response {
  return cors(Response.json(body, { status }), req);
}

export function OPTIONS(request: Request) {
  return cors(new Response(null, { status: 204 }), request);
}

const captureSchema = z.object({
  type: z.enum(["link", "screenshot", "note"]).default("link"),
  title: z.string().min(1).max(500),
  url: z.string().url().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  // data URL: "data:image/png;base64,...."
  screenshot: z.string().optional(),
});

async function uploadScreenshot(
  userId: string,
  dataUrl: string,
): Promise<string> {
  const m = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("Malformed screenshot data URL");
  const contentType = m[1];
  const buffer = Buffer.from(m[2], "base64");
  const ext = contentType.split("/")[1]?.split("+")[0] || "png";
  const path = `${userId}/captures/${randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(MEDIA_BUCKET)
    .upload(path, buffer, { contentType, upsert: false });
  if (error) throw error;
  return path;
}

/**
 * Resolves item content payload according to capture type.
 * Separated to reduce cognitive complexity of POST handler (SonarLint S3776).
 */
function resolveCaptureContent(
  type: "link" | "screenshot" | "note",
  params: {
    title: string;
    url?: string;
    description?: string;
    screenshotPath?: string;
  },
): { content: ItemContent } | { error: string } {
  const { title, url, description, screenshotPath } = params;

  if (type === "screenshot") {
    if (!screenshotPath) {
      return { error: "screenshot is required for type screenshot" };
    }
    return {
      content: { imageUrl: screenshotPath, ...(url ? { sourceUrl: url } : {}) },
    };
  }

  if (type === "note") {
    return { content: { body: description || title } };
  }

  // link (default)
  if (!url) {
    return { error: "url is required for type link" };
  }
  return {
    content: {
      url,
      ...(description ? { description } : {}),
      ...(screenshotPath ? { screenshotUrl: screenshotPath } : {}),
    },
  };
}

export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: "Unauthorized" }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const parsed = captureSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { error: "Invalid capture", details: parsed.error.flatten() },
      400,
    );
  }
  const { type, title, url, description, tags, screenshot } = parsed.data;

  let screenshotPath: string | undefined;
  if (screenshot) {
    try {
      screenshotPath = await uploadScreenshot(user.id, screenshot);
    } catch (e) {
      return json(
        { error: e instanceof Error ? e.message : "Screenshot upload failed" },
        502,
      );
    }
  }

  const resolved = resolveCaptureContent(type, {
    title,
    url,
    description,
    screenshotPath,
  });
  if ("error" in resolved) {
    return json({ error: resolved.error }, 400);
  }
  const content = resolved.content;

  const [row] = await db
    .insert(items)
    .values({ userId: user.id, type, title, content, tags })
    .returning();

  return json({ item: row }, 201);
}
