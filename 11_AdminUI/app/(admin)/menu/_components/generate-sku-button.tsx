"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Barcode } from "lucide-react";
import { assignItemSku } from "@/lib/menu/actions";
import { Button } from "@/components/ui/button";

export function GenerateSkuButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      title="Generate SKU"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await assignItemSku(id);
            toast.success("SKU generated");
            router.refresh();
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed");
          }
        })
      }
    >
      <Barcode className="size-3.5" />
      {pending ? "…" : "Gen SKU"}
    </Button>
  );
}
