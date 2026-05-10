import { type NextRequest, NextResponse } from "next/server";

/** TEMPORARY — delete after debugging auth.
 *  Returns env var diagnostics (no secrets leaked). */
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { email = "", password = "" } = body;
  const expected = process.env.ADMIN_PASSWORD ?? "";

  return NextResponse.json({
    input_password_length: password.length,
    expected_password_length: expected.length,
    input_password_hex: Buffer.from(password).toString("hex"),
    expected_password_hex: Buffer.from(expected).toString("hex"),
    input_email: email,
    expected_email: "admin@mamazainab.com",
    email_match: email === "admin@mamazainab.com",
    password_match: password === expected,
  });
}
