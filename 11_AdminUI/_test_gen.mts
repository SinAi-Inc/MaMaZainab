import { generateImage } from "./lib/nvidia/client.js";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";

process.loadEnvFile(".env.local");

// Use Schnell for fast iteration; safe prompt phrasing avoids NVIDIA content filter
const prompt =
  "Cinematic dystopian neon city at night in torrential rain, dense towers in pink, cyan, and magenta glow, camera viewpoint descending toward one isolated rain-soaked rooftop, wet streets far below reflecting neon, volumetric fog, photoreal, shot on ARRI Alexa 35, anamorphic 2.39:1, cinematic color grade, warm Mediterranean highlights, cool teal shadows.";

console.log("Calling NVIDIA Flux.1 Schnell (1344x768)...");
const start = Date.now();
const result = await generateImage({
  model: "black-forest-labs/flux.1-schnell",
  prompt,
  width: 1344,
  height: 768,
});
const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`Done in ${elapsed}s — contentType: ${result.contentType}, seed: ${result.seed}`);

const dir = path.join(process.cwd(), "public/uploads/generations");
await mkdir(dir, { recursive: true });
const filename = "test_shot1_1.jpg";
await writeFile(path.join(dir, filename), Buffer.from(result.image, "base64"));
console.log(`Saved to public/uploads/generations/${filename} (${Buffer.from(result.image, "base64").length} bytes)`);

// Also update videos.json shot 1.1 to point to this keyframe
const videosPath = path.join(process.cwd(), "data/videos.json");
const data = JSON.parse(await readFile(videosPath, "utf8"));
data.shots[0].keyframeUrl = `/uploads/generations/${filename}`;
data.shots[0].keyframeSeed = result.seed;
data.shots[0].updatedAt = new Date().toISOString();
await writeFile(videosPath, JSON.stringify(data, null, 2));
console.log("Updated videos.json shot 1.1 keyframeUrl");
