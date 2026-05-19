/**
 * Per-second cost estimates (USD) by provider + tier.
 * Tune these as real invoices come in.
 */

export type VideoCostBreakdown = {
  perSecondUsd: number;
  durationSec: number;
  estimatedUsd: number;
  providerLabel: string;
};

const PROVIDER_RATES: Record<string, { label: string; perSecondUsd: number }> = {
  // Runway Gen-4 Turbo — listed $0.05/s (Sep 2025), Gen-4 standard $0.12/s
  runway: { label: "Runway Gen-4", perSecondUsd: 0.05 },
  // RunPod serverless Wan 2.2 — typical L40S ~$0.0007/s GPU time
  // Wan 2.2 needs ~30s GPU per 5s clip → ~$0.021 / 5s ≈ $0.004/s output
  runpod: { label: "RunPod Wan 2.2", perSecondUsd: 0.004 },
  // Local NIM — only electricity
  "local-nim": { label: "Local NIM", perSecondUsd: 0 },
  // Amazon Bedrock Nova Reel — ~$0.06 per 6s clip ≈ $0.01/s
  bedrock: { label: "Amazon Nova Reel", perSecondUsd: 0.01 },
  // fal.ai — varies by sub-model, avg ~$0.04/s
  fal: { label: "fal.ai", perSecondUsd: 0.04 },
};

export function estimateVideoCost(
  providerId: string,
  durationSec: number,
): VideoCostBreakdown {
  const rate = PROVIDER_RATES[providerId] ?? { label: providerId, perSecondUsd: 0 };
  return {
    perSecondUsd: rate.perSecondUsd,
    durationSec,
    estimatedUsd: Number((rate.perSecondUsd * durationSec).toFixed(4)),
    providerLabel: rate.label,
  };
}

export function formatUsd(amount: number): string {
  if (amount === 0) return "Free";
  if (amount < 0.01) return `<$0.01`;
  if (amount < 1) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(2)}`;
}
