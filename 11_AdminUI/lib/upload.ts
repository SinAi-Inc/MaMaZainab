import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";

const BUCKET = "uploads";

// Skip the createBucket round-trip after the first successful upload
let bucketConfirmed = false;

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

  // Only attempt bucket creation once per process — avoids a round-trip on every upload
  if (!bucketConfirmed) {
    await sb.storage.createBucket(BUCKET, { public: true }).catch(() => null);
    bucketConfirmed = true;
  }

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
