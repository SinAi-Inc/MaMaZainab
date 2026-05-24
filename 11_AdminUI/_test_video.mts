/**
 * Test Bedrock Nova Reel video generation for Shot 1.1
 */
import path from "path";
process.loadEnvFile(path.join(import.meta.dirname, ".env.local"));

import { bedrockProvider } from "./lib/video/providers/bedrock.js";

console.log("Configured:", bedrockProvider.isConfigured());

const job = {
  id: "test_vid_1",
  providerId: "bedrock",
  providerJobId: "",
  tier: "hero" as const,
  projectId: "prj_brand_incorporation",
  shotId: "shot_BuYRAQ",
  takeId: "",
  prompt: "Cinematic neon city at night in heavy rain, dense towers glowing pink cyan and magenta, camera slowly descending toward illuminated rooftop, wet streets reflecting colorful lights below, volumetric fog, photoreal",
  negativePrompt: "",
  characterAnchors: [],
  referenceImageUrls: [],
  imageUrl: "",
  aspectRatio: "16:9",
  durationSec: 6,
  seed: 42,
  status: "queued" as const,
  outputUrl: "",
  posterUrl: "",
  estimatedCostUsd: 0.06,
  actualCostUsd: 0,
  error: "",
  providerMeta: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

try {
  const result = await bedrockProvider.submit(job);
  console.log("SUCCESS:", JSON.stringify(result, null, 2));
} catch (e: unknown) {
  console.error("ERROR:", e instanceof Error ? e.message : e);
}
