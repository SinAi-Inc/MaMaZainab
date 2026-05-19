/**
 * Amazon Bedrock — Nova Reel video generation provider.
 *
 * Model: amazon.nova-reel-v1:0  (us-east-1 only)
 * Docs: https://docs.aws.amazon.com/nova/latest/userguide/video-generation.html
 *
 *   POST StartAsyncInvoke  → invocationArn (job ID)
 *   GET  GetAsyncInvoke    → status: InProgress | Completed | Failed
 *   When Completed: output.mp4 stored at s3://{AWS_S3_BUCKET}/nova-reel/{id}/output.mp4
 *
 * Nova Reel v1 constraints:
 *   - Duration: 6 seconds (fixed — only value accepted)
 *   - Resolution: 1280×720 landscape (only value accepted)
 *   - Text-to-video AND image-to-video supported. For i2v, source image
 *     must be PNG/JPEG at exactly 1280×720. Pass via job.imageUrl
 *     (a /uploads/... path). Used by the keyframe-locked pipeline to
 *     pin character identity across multi-shot films.
 *
 * Required env vars:
 *   AWS_S3_BUCKET    — existing S3 bucket in us-east-1 for output storage
 *   AWS_REGION       — optional, defaults to us-east-1
 *
 * Credentials (no explicit keys needed in env — SDK resolves from chain):
 *   Local dev:  ~/.aws/credentials default profile (already configured)
 *   Vercel:     set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY as env vars
 */
import {
  BedrockRuntimeClient,
  StartAsyncInvokeCommand,
  GetAsyncInvokeCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import type { VideoJob } from "../schema";
import type { VideoProvider, ProviderSubmitResult, ProviderPollResult } from "../provider";

const NOVA_REEL_MODEL = "amazon.nova-reel-v1:0";
const NOVA_REEL_REGION = "us-east-1"; // Nova Reel is only available in us-east-1
// Output stored under this prefix inside AWS_S3_BUCKET
const S3_FOLDER_PREFIX = "mamazainab/nova-reel";
const NOVA_REEL_COST_USD = 0.06; // ~$0.06 per 6-second clip

function getRegion(): string {
  return process.env.AWS_REGION || NOVA_REEL_REGION;
}

function getBucket(): string {
  const b = process.env.AWS_S3_BUCKET;
  if (!b) throw new Error("AWS_S3_BUCKET must be set");
  return b;
}

/**
 * Credentials resolved from the standard AWS chain (no explicit passing needed):
 *   1. AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY env vars  (Vercel production)
 *   2. ~/.aws/credentials default profile                  (local dev)
 *   3. IAM instance profile / ECS task role               (cloud deployment)
 */
function makeBedrockClient(): BedrockRuntimeClient {
  return new BedrockRuntimeClient({ region: getRegion() });
}

function makeS3Client(): S3Client {
  return new S3Client({ region: getRegion() });
}

export const bedrockProvider: VideoProvider = {
  id: "bedrock",
  label: "Amazon Nova Reel",
  tier: "hero",
  capabilities: {
    maxDurationSec: 6,
    aspects: ["16:9"],
    // Image-to-video enabled — source image must be exactly 1280x720 PNG/JPEG.
    // Use this with a Shot's locked keyframeUrl to defend against character drift.
    imageToVideo: true,
    characterRefs: false,
    async: true,
  },

  isConfigured(): boolean {
    // Only the bucket name is required — credentials come from the default chain
    return !!process.env.AWS_S3_BUCKET;
  },

  async submit(job: VideoJob): Promise<ProviderSubmitResult> {
    const bedrock = makeBedrockClient();
    const bucket = getBucket();

    // Use a stable ID as the S3 folder so we can locate the output in poll()
    const clipId = `${job.id.replace(/^vid_/, "")}_${nanoid(6)}`;
    const s3Folder = `${S3_FOLDER_PREFIX}/${clipId}`;
    const s3Uri = `s3://${bucket}/${s3Folder}/`;

    // Image-to-video: if job.imageUrl points to a local /uploads asset, load
    // it from disk and embed as base64. Nova Reel requires PNG/JPEG at exactly
    // 1280x720; we assume the keyframe pipeline already enforced dimensions.
    let imagePayload: { format: "png" | "jpeg"; source: { bytes: string } } | null = null;
    if (job.imageUrl && job.imageUrl.startsWith("/uploads/")) {
      try {
        const absPath = path.join(process.cwd(), "public", job.imageUrl.replace(/^\//, ""));
        const buf = await fs.readFile(absPath);
        const ext = path.extname(absPath).toLowerCase();
        const format: "png" | "jpeg" = ext === ".jpg" || ext === ".jpeg" ? "jpeg" : "png";
        imagePayload = { format, source: { bytes: buf.toString("base64") } };
      } catch (e) {
        throw new Error(`Nova Reel: failed to load keyframe ${job.imageUrl} — ${String(e)}`);
      }
    }

    const textToVideoParams: Record<string, unknown> = {
      // Nova Reel max prompt: 512 chars
      text: job.prompt.slice(0, 512),
    };
    if (imagePayload) {
      textToVideoParams.images = [imagePayload];
    }

    const modelInput = {
      taskType: "TEXT_VIDEO",
      textToVideoParams,
      videoGenerationConfig: {
        durationSeconds: 6, // Only 6s accepted in Nova Reel v1
        fps: 24,
        dimension: "1280x720", // Only landscape accepted
        seed: job.seed ?? Math.floor(Math.random() * 2_147_483_647),
      },
    };

    const cmd = new StartAsyncInvokeCommand({
      modelId: NOVA_REEL_MODEL,
      modelInput: modelInput as unknown as Record<string, never>,
      outputDataConfig: {
        s3OutputDataConfig: { s3Uri },
      },
    });

    const res = await bedrock.send(cmd);
    if (!res.invocationArn) {
      throw new Error("Bedrock did not return an invocationArn");
    }

    // Encode ARN + s3Folder together so poll() knows where to find the output
    return {
      providerJobId: `${res.invocationArn}::${s3Folder}`,
      status: "queued",
      meta: { s3Uri, bucket, model: NOVA_REEL_MODEL },
    };
  },

  async poll(providerJobId: string): Promise<ProviderPollResult> {
    const sep = providerJobId.indexOf("::");
    if (sep === -1) {
      return { status: "failed", error: "Malformed providerJobId — expected arn::s3Folder" };
    }

    const invocationArn = providerJobId.slice(0, sep);
    const s3Folder = providerJobId.slice(sep + 2);

    const bedrock = makeBedrockClient();
    const cmd = new GetAsyncInvokeCommand({ invocationArn });
    const res = await bedrock.send(cmd);

    if (res.status === "InProgress") {
      return { status: "running" };
    }

    if (res.status === "Failed") {
      return {
        status: "failed",
        error: res.failureMessage || "Nova Reel generation failed",
      };
    }

    if (res.status === "Completed") {
      try {
        const bucket = getBucket();
        const s3Key = `${s3Folder}/output.mp4`;

        const s3 = makeS3Client();
        const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: s3Key }));

        const outDir = path.join(process.cwd(), "public", "uploads", "generations");
        await fs.mkdir(outDir, { recursive: true });

        const filename = `bedrock_${nanoid(10)}.mp4`;
        const outPath = path.join(outDir, filename);

        const chunks: Uint8Array[] = [];
        for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) {
          chunks.push(chunk);
        }
        await fs.writeFile(outPath, Buffer.concat(chunks));

        return {
          status: "completed",
          outputUrl: `/uploads/generations/${filename}`,
          actualCostUsd: NOVA_REEL_COST_USD,
        };
      } catch (e) {
        return {
          status: "failed",
          error: `Failed to download output from S3: ${String(e)}`,
        };
      }
    }

    // Unexpected status — treat as still running
    return { status: "running" };
  },
};
