import { promises as fs } from "node:fs";
import path from "node:path";
import { ContactsStateSchema, type ContactsState } from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "contacts.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

const EMPTY: ContactsState = { version: 1, contacts: [] };

export async function readContacts(): Promise<ContactsState> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return ContactsStateSchema.parse(JSON.parse(raw));
  } catch {
    return EMPTY;
  }
}

export async function writeContacts(state: ContactsState): Promise<void> {
  await ensureDir();
  await fs.writeFile(FILE, JSON.stringify(state, null, 2), "utf8");
}
