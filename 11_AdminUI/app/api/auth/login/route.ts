import { type NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createSessionToken, COOKIE_NAME, MAX_AGE_SECONDS, type SessionRole } from "@/lib/auth";
import { loginLimiter } from "@/lib/rate-limit";

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ??
  process.env.NEXT_PUBLIC_ADMIN_UI_USERNAME ??
  "admin@mamazainab.com";

function safeEqual(input: string, expected: string): boolean {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);
  return (
    inputBuffer.length === expectedBuffer.length &&
    timingSafeEqual(inputBuffer, expectedBuffer)
  );
}

function matchCredential(
  email: string,
  password: string,
): { role: SessionRole; email: string } | null {
  const credentials: Array<{ email: string; password: string; role: SessionRole }> = [
    { email: ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD ?? "", role: "admin" },
  ];

  if (process.env.ART_DIRECTOR_EMAIL && process.env.ART_DIRECTOR_PASSWORD) {
    credentials.push({
      email: process.env.ART_DIRECTOR_EMAIL,
      password: process.env.ART_DIRECTOR_PASSWORD,
      role: "art_director",
    });
  }

  for (const credential of credentials) {
    if (
      credential.password &&
      safeEqual(email, credential.email) &&
      safeEqual(password, credential.password)
    ) {
      return { role: credential.role, email: credential.email };
    }
  }

  return null;
}

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
  const session = matchCredential(email, password);
  if (!session) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken(session.role, session.email);
  const res = NextResponse.json({ ok: true, role: session.role });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
