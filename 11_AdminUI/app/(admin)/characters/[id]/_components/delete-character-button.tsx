"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteCharacter } from "@/lib/characters/actions";
import { Button } from "@/components/ui/button";

export function DeleteCharacterButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    start(async () => {
      try {
        await deleteCharacter(id);
        toast.success("Character deleted");
        router.push("/characters");
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDelete} disabled={pending} className="text-brand-red border-brand-red/40 hover:bg-brand-red/5">
      <Trash2 className="size-4 mr-1.5" />
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
