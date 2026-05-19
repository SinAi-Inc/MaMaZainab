"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteItem, toggleItemAvailable } from "@/lib/menu/actions";

export function ItemActions({
  id,
  available,
}: {
  id: string;
  available: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button
        variant="ghost"
        size="sm"
        title={available ? "Hide from menu" : "Show on menu"}
        disabled={pending}
        onClick={() =>
          start(async () => {
            try {
              await toggleItemAvailable(id);
              toast.success(available ? "Hidden" : "Made available");
              router.refresh();
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          })
        }
      >
        {available ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </Button>
      <Link href={`/menu/items/${id}/edit`}>
        <Button variant="outline" size="sm" title="Edit item">
          <Pencil className="size-3.5" /> Edit
        </Button>
      </Link>
      {confirming ? (
        <>
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                try {
                  await deleteItem(id);
                  toast.success("Deleted");
                  router.refresh();
                } catch (e: unknown) {
                  toast.error(e instanceof Error ? e.message : "Failed");
                } finally {
                  setConfirming(false);
                }
              })
            }
          >
            Confirm
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          title="Delete"
          onClick={() => setConfirming(true)}
        >
          <Trash2 className="size-4 text-brand-red" />
        </Button>
      )}
    </div>
  );
}
