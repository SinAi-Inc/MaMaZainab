"use client";

import { useTransition } from "react";
import { deleteContact } from "@/lib/contacts/actions";
import { Trash2 } from "lucide-react";

export function DeleteContactButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => deleteContact(id))}
      className="p-1.5 rounded hover:bg-red-50 text-muted hover:text-red-600 transition disabled:opacity-40"
      title="Remove contact"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
