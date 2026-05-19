"use server";

import { revalidatePath } from "next/cache";
import { readContacts, writeContacts } from "./store";

export async function deleteContact(id: string) {
  const state = await readContacts();
  state.contacts = state.contacts.filter((c) => c.id !== id);
  await writeContacts(state);
  revalidatePath("/contacts");
}
