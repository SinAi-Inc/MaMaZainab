/**
 * Poll Bedrock Nova Reel job status
 * Usage: npx tsx _test_video_poll.mts <providerJobId>
 */
import path from "path";
process.loadEnvFile(path.join(import.meta.dirname, ".env.local"));

import { bedrockProvider } from "./lib/video/providers/bedrock.js";

const jobId = process.argv[2] || "arn:aws:bedrock:us-east-1:589820791129:async-invoke/juwvwhsdmrhv::mamazainab/nova-reel/test_vid_1_FIyCBp";

console.log("Polling:", jobId.substring(0, 80) + "...");

try {
  const result = await bedrockProvider.poll(jobId);
  console.log("Result:", JSON.stringify(result, null, 2));
} catch (e: unknown) {
  console.error("ERROR:", e instanceof Error ? e.message : e);
}
