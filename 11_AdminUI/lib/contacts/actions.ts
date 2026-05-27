"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/server-action-auth";
import { readContacts, writeContacts } from "./store";

export async function deleteContact(id: string) {
  await requireAdminAction();
  const state = await readContacts();
  state.contacts = state.contacts.filter((c) => c.id !== id);
  await writeContacts(state);
  revalidatePath("/contacts");
}
