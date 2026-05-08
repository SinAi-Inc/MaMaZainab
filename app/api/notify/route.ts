import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { insertContact, contactExists } from "@/lib/contacts/store";

/* ── In-memory rate limiter (per IP, 3 requests / 60 s) ─────────────── */
const WINDOW_MS = 60_000;
const MAX_HITS = 3;
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_HITS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.redirect(new URL("/coming-soon?subscribed=limited", req.url), 303);
  }

  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!ok) {
    return NextResponse.redirect(new URL("/coming-soon?subscribed=invalid", req.url), 303);
  }

  const exists = await contactExists(email);
  if (!exists) {
    await insertContact({
      id: nanoid(10),
      email,
      subscribedAt: new Date().toISOString(),
      source: "coming-soon",
    });
    revalidatePath("/contacts");
  }

  return NextResponse.redirect(new URL("/coming-soon?subscribed=ok", req.url), 303);
}
