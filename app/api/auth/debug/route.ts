import { NextResponse } from "next/server";

/** TEMPORARY — delete after debugging auth.
 *  Returns env var diagnostics (no secrets leaked). */
export async function GET() {
  return NextResponse.json({
    ADMIN_PASSWORD_set: !!process.env.ADMIN_PASSWORD,
    ADMIN_PASSWORD_length: (process.env.ADMIN_PASSWORD ?? "").length,
    ADMIN_JWT_SECRET_set: !!process.env.ADMIN_JWT_SECRET,
    ADMIN_JWT_SECRET_length: (process.env.ADMIN_JWT_SECRET ?? "").length,
    NODE_ENV: process.env.NODE_ENV,
  });
}
