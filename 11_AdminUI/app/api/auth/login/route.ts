import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createSessionToken, COOKIE_NAME, MAX_AGE_SECONDS } from "@/lib/auth";
import { loginLimiter } from "@/lib/rate-limit";

const ADMIN_EMAIL = "admin@mamazainab.com";

export async function POST(req: NextRequest) {
  const limited = loginLimiter(req);
  if (limited) return limited;

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { email = "", password = "" } = body;

  const expectedEmail = Buffer.from(ADMIN_EMAIL);
  const expectedPassword = Buffer.from(process.env.ADMIN_PASSWORD ?? "");
  const inputEmail = Buffer.from(email);
  const inputPassword = Buffer.from(password);

  // Constant-time comparisons — prevents timing-based enumeration attacks
  const emailMatch =
    inputEmail.length === expectedEmail.length &&
    timingSafeEqual(inputEmail, expectedEmail);
  const passwordMatch =
    inputPassword.length === expectedPassword.length &&
    timingSafeEqual(inputPassword, expectedPassword);

  if (!emailMatch || !passwordMatch || !process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
