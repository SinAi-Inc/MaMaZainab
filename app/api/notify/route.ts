import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { readContacts, writeContacts } from "@/lib/contacts/store";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!ok) {
    return NextResponse.redirect(new URL("/coming-soon?subscribed=invalid", req.url), 303);
  }

  const state = await readContacts();
  const alreadyExists = state.contacts.some((c) => c.email === email);
  if (!alreadyExists) {
    state.contacts.push({
      id: nanoid(10),
      email,
      subscribedAt: new Date().toISOString(),
      source: "coming-soon",
    });
    await writeContacts(state);
    revalidatePath("/contacts");
  }

  return NextResponse.redirect(new URL("/coming-soon?subscribed=ok", req.url), 303);
}
