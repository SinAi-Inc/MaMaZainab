"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FileText, Sparkles, Upload } from "lucide-react";
import {
  ProjectInputSchema,
  type ProjectInput,
  type ProjectInputRaw,
  PROJECT_STATUS_META,
  MODEL_META,
  type ProjectStatus,
  type VideoModel,
} from "@/lib/videos/schema";
import {
  createProject,
  reparseProjectScript,
} from "@/lib/videos/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Textarea } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";

const STATUSES = Object.keys(PROJECT_STATUS_META) as ProjectStatus[];
const MODELS = Object.keys(MODEL_META) as VideoModel[];
const ASPECTS = ["2.39:1", "16:9", "9:16", "1:1", "4:3"];

export default function NewProjectPage() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [parseAfter, setParseAfter] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectInputRaw, unknown, ProjectInput>({
    resolver: zodResolver(ProjectInputSchema),
    defaultValues: {
      title: "",
      logline: "",
      synopsis: "",
      status: "concept",
      script: "",
      scriptSourcePath: "",
      targetDurationSec: 60,
      aspectRatio: "16:9",
      defaultModel: "nvidia/cosmos-nemotron-cc-generate1-12b",
      styleSuffix:
        "shot on ARRI Alexa 35, cinematic color grade, photoreal, no text overlay",
      posterUrl: "",
      masterCutUrl: "",
      tags: [],
    },
  });

  const onSubmit = (data: ProjectInput) =>
    start(async () => {
      try {
        const p = await createProject({
          ...data,
          tags: typeof data.tags === "string"
            ? String(data.tags)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : data.tags,
        });
        if (parseAfter && data.script.trim()) {
          const r = await reparseProjectScript(p.id, data.script);
          toast.success(
            `Project created - parsed ${r.scenes} scene${r.scenes === 1 ? "" : "s"}, ${r.shots} shot${r.shots === 1 ? "" : "s"}`,
          );
        } else {
          toast.success("Project created");
        }
        router.push(`/videos/${p.id}`);
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            Generation Studio
          </p>
          <h2 className="text-2xl font-semibold mt-1 flex items-center gap-2">
            <Sparkles className="size-5 text-brand-green-deep" />
            New video project
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardBody className="space-y-5">
            <div>
              <Label required>Title</Label>
              <Input
                {...register("title")}
                placeholder="e.g. Brand Incorporation - Hero Film"
              />
              <FieldError>{errors.title?.message}</FieldError>
            </div>

            <div>
              <Label>Logline</Label>
              <Input
                {...register("logline")}
                placeholder="One-sentence pitch."
              />
            </div>

            <div>
              <Label>Synopsis</Label>
              <Textarea
                {...register("synopsis")}
                rows={3}
                placeholder="Short paragraph summary (audience, tone, arc)."
              />
            </div>

            <div>
              <Label hint="Markdown - scenes split on `---` and `**SCENE N**` markers">
                <span className="inline-flex items-center gap-1">
                  <FileText className="size-3.5" /> Script
                </span>
              </Label>
              <Textarea
                {...register("script")}
                rows={14}
                className="font-mono text-xs"
                placeholder="Paste your full Markdown script here…"
              />
              <label className="mt-2 inline-flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={parseAfter}
                  onChange={(e) => setParseAfter(e.target.checked)}
                  className="size-3.5"
                />
                Auto-parse into scenes &amp; shots after creating
              </label>
            </div>

            <div>
              <Label hint="path inside repo (optional)">
                Source script path
              </Label>
              <Input
                {...register("scriptSourcePath")}
                placeholder="e.g. 04_Scripts/MaMa Zainab.md"
              />
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <div>
                <Label>Status</Label>
                <select
                  {...register("status")}
                  className="h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PROJECT_STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label hint="seconds">Target runtime</Label>
                  <Input type="number" min="0" {...register("targetDurationSec")} />
                </div>
                <div>
                  <Label>Aspect</Label>
                  <select
                    {...register("aspectRatio")}
                    className="h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                  >
                    {ASPECTS.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label>Default model</Label>
                <select
                  {...register("defaultModel")}
                  className="h-10 w-full rounded-md border border-border-strong bg-white px-3 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/20"
                >
                  {MODELS.map((m) => (
                    <option key={m} value={m}>
                      {MODEL_META[m].label} · {MODEL_META[m].vendor}
                    </option>
                  ))}
                </select>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              <Label hint="appended to every shot prompt">Style suffix</Label>
              <Textarea
                {...register("styleSuffix")}
                rows={5}
                className="text-xs font-mono"
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              <Label hint="comma-separated">Tags</Label>
              <Input
                {...register("tags" as never)}
                placeholder="brand, launch, cinematic"
              />
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/videos")}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          <Upload className="size-4" />
          {pending ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
