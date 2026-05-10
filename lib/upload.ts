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

  if (!isSupabaseConfigured()) {
    const dir = path.join(process.cwd(), "public", "uploads", subdir);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buf);
    return `/uploads/${subdir}/${filename}`;
  }

  const sb = getSupabase();
  const storagePath = `${subdir}/${filename}`;

  // Auto-create the bucket if it doesn't exist yet (idempotent)
  const { error: bucketErr } = await sb.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 314572800, // 300 MB
  });
  // Ignore "already exists" error (23505 = unique_violation)
  if (bucketErr && !bucketErr.message.includes("already exists") && bucketErr.message !== "Bucket already exists") {
    throw new Error(`Storage bucket error: ${bucketErr.message}`);
  }

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(storagePath, buf, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
