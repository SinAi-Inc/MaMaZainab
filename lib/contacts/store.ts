import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { toCamel, toSnake } from "@/lib/case";
import { ContactsStateSchema, type Contact, type ContactsState } from "./schema";

const FILE = path.join(process.cwd(), "data", "contacts.json");
const DATA_DIR = path.join(process.cwd(), "data");



async function readJson(): Promise<ContactsState> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return ContactsStateSchema.parse(JSON.parse(raw));
  } catch {
    return { version: 1, contacts: [] };
  }
}

async function writeJson(state: ContactsState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(state, null, 2), "utf8");
}



export async function readContacts(): Promise<ContactsState> {
  if (!isSupabaseConfigured()) return readJson();
  const { data, error } = await getSupabase()
    .from("contacts")
    .select("*")
    .order("subscribed_at", { ascending: false });
  if (error) throw error;
  const contacts = (data ?? []).map((r) => toCamel(r) as unknown as Contact);
  return { version: 1, contacts };
}

export async function writeContacts(state: ContactsState): Promise<void> {
  if (!isSupabaseConfigured()) return writeJson(state);
  const sb = getSupabase();
  await sb.from("contacts").delete().neq("id", "");
  if (state.contacts.length > 0) {
    const rows = state.contacts.map((c) => toSnake(c as unknown as Record<string, unknown>));
    const { error } = await sb.from("contacts").insert(rows);
    if (error) throw error;
  }
}

/** Insert a single contact (optimised for the notify route). */
export async function insertContact(contact: Contact): Promise<void> {
  if (!isSupabaseConfigured()) {
    const state = await readJson();
    state.contacts.push(contact);
    return writeJson(state);
  }
  const { error } = await getSupabase()
    .from("contacts")
    .insert(toSnake(contact as unknown as Record<string, unknown>));
  if (error) throw error;
}

/** Check if an email already exists. */
export async function contactExists(email: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const state = await readJson();
    return state.contacts.some((c) => c.email === email);
  }
  const { count } = await getSupabase()
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("email", email);
  return (count ?? 0) > 0;
}
