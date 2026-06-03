/**
 * Lightweight client-facing summary of a video provider - safe to pass
 * from a Server Component to a Client Component (no methods, no secrets).
 */
import { listProviders } from "./provider";
import type { VideoTier } from "./schema";

export type ProviderSummary = {
  id: string;
  label: string;
  tier: VideoTier;
  configured: boolean;
  maxDurationSec: number;
  aspects: string[];
  imageToVideo: boolean;
  characterRefs: boolean;
};

export async function getProviderSummaries(): Promise<ProviderSummary[]> {
  const providers = await listProviders();
  return providers.map((p) => ({
    id: p.id,
    label: p.label,
    tier: p.tier,
    configured: p.isConfigured(),
    maxDurationSec: p.capabilities.maxDurationSec,
    aspects: p.capabilities.aspects,
    imageToVideo: p.capabilities.imageToVideo,
    characterRefs: p.capabilities.characterRefs,
  }));
}
