/**
 * VideoProvider abstraction — every backend (Runway, RunPod, local NIM)
 * implements this interface. The UI never knows which provider runs;
 * it just submits a brand-locked job and polls.
 */
import type { VideoJob, VideoJobInput, VideoTier } from "./schema";

export type ProviderCapabilities = {
  /** Max single-clip duration in seconds */
  maxDurationSec: number;
  /** Supported aspect ratios */
  aspects: string[];
  /** Whether the provider can use a reference image (img-to-vid) */
  imageToVideo: boolean;
  /** Whether the provider supports per-character reference images */
  characterRefs: boolean;
  /** Whether jobs are async (require polling) */
  async: boolean;
};

export type ProviderSubmitResult = {
  /** Provider's internal job ID (for polling) */
  providerJobId: string;
  /** Initial status — most providers return "queued" or "running" */
  status: "queued" | "running" | "completed" | "failed";
  /** Some providers (local NIM small clips) may return URL immediately */
  outputUrl?: string;
  /** Optional poster URL */
  posterUrl?: string;
  /** Provider-specific metadata (model version, region, etc.) */
  meta?: Record<string, unknown>;
};

export type ProviderPollResult = {
  status: "queued" | "running" | "completed" | "failed" | "canceled";
  /** Public URL to the MP4 (when complete) */
  outputUrl?: string;
  posterUrl?: string;
  error?: string;
  /** Actual cost if the provider reports it */
  actualCostUsd?: number;
  /** Progress 0..1 if the provider reports it */
  progress?: number;
};

export interface VideoProvider {
  id: string;
  label: string;
  tier: VideoTier;
  capabilities: ProviderCapabilities;
  /** True only when API keys / endpoints are configured */
  isConfigured(): boolean;
  submit(job: VideoJob): Promise<ProviderSubmitResult>;
  poll(providerJobId: string, job?: VideoJob): Promise<ProviderPollResult>;
  /** Best-effort cancel (some providers can't cancel) */
  cancel?(providerJobId: string): Promise<void>;
}

/* --------------------------------------------------------------- */
/*  Registry — lazy-loads providers (avoid circular imports)        */
/* --------------------------------------------------------------- */

let _registry: Record<string, VideoProvider> | null = null;

async function loadRegistry(): Promise<Record<string, VideoProvider>> {
  if (_registry) return _registry;
  const [{ runwayProvider }, { runpodProvider }, { localNimProvider }, { bedrockProvider }, { falProvider }] = await Promise.all([
    import("./providers/runway"),
    import("./providers/runpod"),
    import("./providers/local-nim"),
    import("./providers/bedrock"),
    import("./providers/fal"),
  ]);
  _registry = {
    [runwayProvider.id]: runwayProvider,
    [runpodProvider.id]: runpodProvider,
    [localNimProvider.id]: localNimProvider,
    [bedrockProvider.id]: bedrockProvider,
    [falProvider.id]: falProvider,
  };
  return _registry;
}

export async function getProvider(id: string): Promise<VideoProvider | null> {
  const r = await loadRegistry();
  return r[id] ?? null;
}

export async function listProviders(): Promise<VideoProvider[]> {
  const r = await loadRegistry();
  return Object.values(r);
}

/** List providers that are actually configured (have API keys etc). */
export async function listAvailableProviders(): Promise<VideoProvider[]> {
  const all = await listProviders();
  return all.filter((p) => p.isConfigured());
}

/**
 * Pick the best provider for a job based on tier preference + capabilities.
 * Fallback chain: requested tier → other configured providers → null.
 */
export async function pickProvider(
  input: Pick<VideoJobInput, "providerId" | "tier" | "durationSec" | "aspectRatio">,
): Promise<VideoProvider | null> {
  if (input.providerId) {
    const explicit = await getProvider(input.providerId);
    if (explicit?.isConfigured()) return explicit;
  }
  const available = await listAvailableProviders();
  if (available.length === 0) return null;

  // Preferred tier first
  const tierMatch = available.filter((p) => p.tier === input.tier);
  const order = tierMatch.length > 0 ? tierMatch.concat(available.filter((p) => p.tier !== input.tier)) : available;

  // Filter by capabilities
  return (
    order.find(
      (p) =>
        p.capabilities.maxDurationSec >= input.durationSec &&
        p.capabilities.aspects.includes(input.aspectRatio),
    ) ?? order[0]
  );
}
