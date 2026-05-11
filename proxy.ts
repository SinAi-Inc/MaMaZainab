import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "mz_admin_session";

/* ── Session floor cache (Edge-compatible) ────────────────────────────── */
let _floorCache = { value: 0, expiresAt: 0 };

/** Read session_floor from Supabase (prod) with a 60-second in-memory cache. */
async function getSessionFloor(): Promise<number> {
  const now = Date.now();
  if (_floorCache.expiresAt > now) return _floorCache.value;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return 0;

  try {
    const res = await fetch(
      `${url}/rest/v1/settings?id=eq.1&select=session_floor`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    const data = await res.json();
    const raw = data?.[0]?.session_floor;
    const floor = raw ? Math.floor(new Date(raw).getTime() / 1000) : 0;
    _floorCache = { value: floor, expiresAt: now + 60_000 };
    return floor;
  } catch {
    return _floorCache.value;
  }
}

/**
 * Paths that are publicly accessible without authentication.
 * Everything else (admin dashboard, API generators, etc.) requires a valid session.
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/coming-soon",
  "/menu/preview",
  "/menu/print",
  "/partner-portal",
  "/cn",
  "/api/auth/",
  "/api/notify",
];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const rawSecret = process.env.ADMIN_JWT_SECRET ?? "";
  const secret = new TextEncoder().encode(rawSecret);
  const token = req.cookies.get(COOKIE)?.value;

  if (token && rawSecret) {
    try {
      const { payload } = await jwtVerify(token, secret);

      // Reject tokens issued before session floor ("end all sessions")
      const floor = await getSessionFloor();
      if (floor && (payload.iat ?? 0) < floor) {
        // Token is pre-floor — treat as expired
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("next", pathname);
        const res = NextResponse.redirect(loginUrl);
        res.cookies.delete(COOKIE);
        return res;
      }

      return NextResponse.next();
    } catch {
      // Token invalid or expired — fall through to redirect
    }
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  const res = NextResponse.redirect(loginUrl);
  res.cookies.delete(COOKIE);
  return res;
}

export const config = {
  // Run on all paths except static assets
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|brand/|uploads/).*)"],
};
