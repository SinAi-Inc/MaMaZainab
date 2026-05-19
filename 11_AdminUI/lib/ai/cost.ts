/**
 * Per-model cost estimates for generations.
 * Used to track cumulative usage in the History tab.
 *
 * Numbers are approximate USD per call. NVIDIA API Catalog pricing is
 * credit-based; we map credit costs to ~USD using public catalog rates.
 */

type ModelCostEntry = {
  /** Approximate cost per generation in USD */
  perCallUsd: number;
  /** Optional note shown in tooltip */
  note?: string;
};

const MODEL_COSTS: Record<string, ModelCostEntry> = {
  // Black Forest Labs (NVIDIA-hosted) — live models
  "black-forest-labs/flux.1-dev": { perCallUsd: 0.04, note: "~50 steps" },
  "black-forest-labs/flux.1-schnell": { perCallUsd: 0.003, note: "4 steps, fast" },
  // Local ComfyUI — free (CPU/AMD render)
  "comfyui": { perCallUsd: 0, note: "local render" },
};

/** Get the estimated cost for a single generation call. */
export function estimateCostUsd(modelId: string): number {
  return MODEL_COSTS[modelId]?.perCallUsd ?? 0;
}

/** Get the cost note/tooltip for a model (e.g. "~50 steps"). */
export function getCostNote(modelId: string): string | undefined {
  return MODEL_COSTS[modelId]?.note;
}

/** Format a USD amount for display. */
export function formatCost(usd: number): string {
  if (usd === 0) return "—";
  if (usd < 0.01) return `<$0.01`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}
