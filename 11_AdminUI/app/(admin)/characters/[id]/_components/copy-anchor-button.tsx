"use client";

import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyAnchorButton({ text }: { text: string }) {
  if (!text) return null;
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => { navigator.clipboard.writeText(text); toast.success("Anchor block copied!"); }}
    >
      <Copy className="size-3.5 mr-1" /> Copy Anchor
    </Button>
  );
}
