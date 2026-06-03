"use client";

import { useRef } from "react";
import Barcode from "react-barcode";
import { Download } from "lucide-react";

interface SkuBarcodeProps {
  sku: string;
  itemName?: string;
  /** compact = small inline badge; full = full print-ready card */
  variant?: "compact" | "full";
}

export function SkuBarcode({ sku, itemName, variant = "compact" }: SkuBarcodeProps) {
  const ref = useRef<HTMLDivElement>(null);

  if (!sku) return null;

  const handleDownload = () => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcode-${sku}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-2">
        <span className="font-mono text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200">
          {sku}
        </span>
      </div>
    );
  }

  // full variant - shown in item detail / form
  return (
    <div className="flex flex-col items-center gap-3 p-4 border border-border rounded-xl bg-white w-fit">
      {itemName && (
        <p className="text-xs font-semibold text-center text-brand-ink uppercase tracking-wide">
          {itemName}
        </p>
      )}
      <div ref={ref}>
        <Barcode
          value={sku}
          format="CODE128"
          width={1.5}
          height={48}
          displayValue={true}
          fontSize={11}
          margin={6}
          background="#ffffff"
          lineColor="#1a1a1a"
        />
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-brand-green-deep transition-colors"
      >
        <Download className="size-3" /> Download SVG
      </button>
    </div>
  );
}
