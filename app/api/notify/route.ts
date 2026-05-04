import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "data", "subscribers.json");

async function readList(): Promise<string[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!ok) {
    return NextResponse.redirect(new URL("/?subscribed=invalid", req.url), 303);
  }

  const list = await readList();
  if (!list.includes(email)) {
    list.push(email);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
  }
  return NextResponse.redirect(new URL("/?subscribed=ok", req.url), 303);
}
