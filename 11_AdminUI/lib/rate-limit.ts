import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  windowMs: number;
  maxHits: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function hitRateLimit(name: string, key: string, opts: RateLimiterOptions): number | null {
  if (!stores.has(name)) stores.set(name, new Map());
  const hits = stores.get(name)!;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + opts.windowMs });
    return null;
  }

  entry.count++;
  if (entry.count > opts.maxHits) {
    return Math.ceil((entry.resetAt - now) / 1000);
  }

  return null;
}

/**
 * Create a named rate limiter. Each name shares its own hit counter map.
 * In-memory - effective for single-instance deployments.
 * For serverless (Vercel), back with Redis/Upstash in production.
 */
export function createRateLimiter(name: string, opts: RateLimiterOptions) {
  return function rateLimit(req: NextRequest): NextResponse | null {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip")?.trim() ??
      "unknown";
    const retryAfter = hitRateLimit(name, ip, opts);
    if (retryAfter !== null) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }
    return null;
  };
}

export async function checkServerActionRateLimit(
  name: string,
  opts: RateLimiterOptions,
): Promise<{ limited: boolean; retryAfter: number }> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip")?.trim() ??
    "unknown";
  const retryAfter = hitRateLimit(name, ip, opts);
  return { limited: retryAfter !== null, retryAfter: retryAfter ?? 0 };
}

/** Login: 5 attempts per minute per IP */
export const loginLimiter = createRateLimiter("login", { windowMs: 60_000, maxHits: 5 });

/** Image generation: 10 requests per minute per IP */
export const generateImageLimiter = createRateLimiter("gen-image", { windowMs: 60_000, maxHits: 10 });

/** Model validation: 5 requests per minute per IP */
export const validateModelsLimiter = createRateLimiter("validate-models", { windowMs: 60_000, maxHits: 5 });

/** Menu sync: 3 requests per minute per IP */
export const menuSyncLimiter = createRateLimiter("menu-sync", { windowMs: 60_000, maxHits: 3 });

/** Video generation: 3 jobs per minute per IP (video is expensive) */
export const videoGenLimiter = createRateLimiter("gen-video", { windowMs: 60_000, maxHits: 3 });
