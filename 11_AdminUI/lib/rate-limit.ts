import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  windowMs: number;
  maxHits: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Create a named rate limiter. Each name shares its own hit counter map.
 * In-memory — effective for single-instance deployments.
 * For serverless (Vercel), back with Redis/Upstash in production.
 */
export function createRateLimiter(name: string, opts: RateLimiterOptions) {
  if (!stores.has(name)) stores.set(name, new Map());
  const hits = stores.get(name)!;

  return function rateLimit(req: NextRequest): NextResponse | null {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip")?.trim() ??
      "unknown";
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || now > entry.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + opts.windowMs });
      return null;
    }

    entry.count++;
    if (entry.count > opts.maxHits) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)) } },
      );
    }
    return null;
  };
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
