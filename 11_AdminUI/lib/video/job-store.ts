import { promises as fs } from "node:fs";
import path from "node:path";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { toSnake, toCamel } from "@/lib/case";
import { VideoJobStateSchema, type VideoJob, type VideoJobState } from "./schema";

const FILE = path.join(process.cwd(), "data", "video-jobs.json");
const DATA_DIR = path.join(process.cwd(), "data");

async function readJson(): Promise<VideoJobState> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return VideoJobStateSchema.parse(JSON.parse(raw));
  } catch {
    return { version: 1, jobs: [] };
  }
}

async function writeJson(state: VideoJobState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(state, null, 2), "utf8");
}

function jobToRow(j: VideoJob): Record<string, unknown> {
  return toSnake(j as unknown as Record<string, unknown>);
}

function rowToJob(row: Record<string, unknown>): VideoJob {
  return toCamel(row) as unknown as VideoJob;
}

/** Insert or replace a job (uses id). */
export async function upsertJob(job: VideoJob): Promise<void> {
  if (!isSupabaseConfigured()) {
    const state = await readJson();
    const idx = state.jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) state.jobs[idx] = job;
    else state.jobs.unshift(job);
    if (state.jobs.length > 500) state.jobs = state.jobs.slice(0, 500);
    return writeJson(state);
  }
  const { error } = await getSupabase()
    .from("video_jobs")
    .upsert(jobToRow(job), { onConflict: "id" });
  if (error) {
    console.warn(`video_jobs upsert (Supabase): ${error.message} — falling back to JSON`);
    const state = await readJson();
    const idx = state.jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) state.jobs[idx] = job;
    else state.jobs.unshift(job);
    if (state.jobs.length > 500) state.jobs = state.jobs.slice(0, 500);
    return writeJson(state);
  }
}

export async function getJob(id: string): Promise<VideoJob | null> {
  if (!isSupabaseConfigured()) {
    const state = await readJson();
    return state.jobs.find((j) => j.id === id) ?? null;
  }
  const { data, error } = await getSupabase()
    .from("video_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToJob(data as unknown as Record<string, unknown>);
}

export async function listJobs(filter?: {
  projectId?: string;
  shotId?: string;
  status?: string;
  limit?: number;
}): Promise<VideoJob[]> {
  const limit = filter?.limit ?? 100;
  if (!isSupabaseConfigured()) {
    const state = await readJson();
    let jobs = state.jobs;
    if (filter?.projectId) jobs = jobs.filter((j) => j.projectId === filter.projectId);
    if (filter?.shotId) jobs = jobs.filter((j) => j.shotId === filter.shotId);
    if (filter?.status) jobs = jobs.filter((j) => j.status === filter.status);
    return jobs.slice(0, limit);
  }
  let q = getSupabase().from("video_jobs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (filter?.projectId) q = q.eq("project_id", filter.projectId);
  if (filter?.shotId) q = q.eq("shot_id", filter.shotId);
  if (filter?.status) q = q.eq("status", filter.status);
  const { data, error } = await q;
  if (error) return [];
  return (data ?? []).map((r) => rowToJob(r as unknown as Record<string, unknown>));
}

export async function deleteJob(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const state = await readJson();
    state.jobs = state.jobs.filter((j) => j.id !== id);
    return writeJson(state);
  }
  const { error } = await getSupabase().from("video_jobs").delete().eq("id", id);
  if (error) {
    console.warn(`video_jobs delete (Supabase): ${error.message} — falling back to JSON`);
    const state = await readJson();
    state.jobs = state.jobs.filter((j) => j.id !== id);
    return writeJson(state);
  }
}

/** Sum actualCostUsd for a project (used for budget tracking). */
export async function sumProjectSpend(projectId: string): Promise<number> {
  const jobs = await listJobs({ projectId, limit: 500 });
  return jobs.reduce((acc, j) => acc + (j.actualCostUsd || j.estimatedCostUsd || 0), 0);
}
