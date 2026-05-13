import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";

const BUCKET = "uploads";

/**
 * Upload a file to Supabase Storage (or local disk as fallback) and return its URL.
 */
export async function uploadFile(
  file: File,
  subdir: string,
  allowedExts: string[],
  maxBytes: number,
): Promise<string> {
  if (file.size > maxBytes) {
    throw new Error(`Max ${Math.round(maxBytes / 1024 / 1024)} MB`);
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!allowedExts.includes(ext)) {
    throw new Error(`Allowed: ${allowedExts.join(", ")}`);
  }

  const filename = `${nanoid(10)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  // Prevent path traversal via subdir
  if (/[\\\/]\.\./.test(subdir) || subdir.includes("..") || path.isAbsolute(subdir)) {
    throw new Error("Invalid upload directory");
  }

  if (!isSupabaseConfigured()) {
    const dir = path.join(process.cwd(), "public", "uploads", subdir);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buf);
    return `/uploads/${subdir}/${filename}`;
  }

  const sb = getSupabase();
  const storagePath = `${subdir}/${filename}`;

  // Best-effort bucket creation — ignore all errors (bucket may already exist,
  // or the plan's fileSizeLimit may differ). The upload call below will surface
  // any real problem with a descriptive message.
  await sb.storage.createBucket(BUCKET, { public: true }).catch(() => null);

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(storagePath, buf, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  // Always return relative path — Next.js rewrite proxies to Supabase Storage
  return `/uploads/${subdir}/${filename}`;
}
