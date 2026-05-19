"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyHexButton({ hex }: { hex: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      title={`Copy ${hex}`}
      className="flex items-center gap-0.5 text-muted hover:text-brand-green-deep transition-colors"
    >
      {copied ? <Check className="size-3 text-brand-green" /> : <Copy className="size-3" />}
    </button>
  );
}
