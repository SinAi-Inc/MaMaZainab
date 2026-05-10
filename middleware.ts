import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "mz_admin_session";

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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const rawSecret = process.env.ADMIN_JWT_SECRET ?? "";
  const secret = new TextEncoder().encode(rawSecret);
  const token = req.cookies.get(COOKIE)?.value;

  if (token && rawSecret) {
    try {
      await jwtVerify(token, secret);
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
