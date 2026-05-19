"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Wand2, Save, FolderOpen } from "lucide-react";
import {
  reparseProjectScript,
  updateProject,
  loadScriptFromRepo,
} from "@/lib/videos/actions";
import type { Project } from "@/lib/videos/schema";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Textarea, Label } from "@/components/ui/input";

export function ScriptPanel({ project }: { project: Project }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [script, setScript] = useState(project.script);

  const onSave = () =>
    start(async () => {
      try {
        await updateProject(project.id, { ...project, script });
        toast.success("Script saved");
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });

  const onParse = () => {
    if (!script.trim()) {
      toast.error("Script is empty");
      return;
    }
    if (
      !confirm(
        "Re-parse will replace existing scenes, shots and takes for this project. Continue?",
      )
    )
      return;
    start(async () => {
      try {
        const r = await reparseProjectScript(project.id, script);
        toast.success(
          `Parsed ${r.scenes} scene${r.scenes === 1 ? "" : "s"} and ${r.shots} shot${r.shots === 1 ? "" : "s"}`,
        );
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  };

  const onLoadFromRepo = () => {
    if (!project.scriptSourcePath) {
      toast.error("Set a source script path on the project first");
      return;
    }
    start(async () => {
      try {
        const r = await loadScriptFromRepo(project.id, project.scriptSourcePath);
        toast.success(
          `Loaded & parsed: ${r.scenes} scenes, ${r.shots} shots`,
        );
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to load");
      }
    });
  };

  return (
    <Card className="xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-2rem)] flex flex-col">
      <CardBody className="space-y-3 flex flex-col min-h-0">
        <div className="flex items-center justify-between gap-2">
          <Label className="!mb-0">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-4 text-brand-green-deep" />
              Script
            </span>
          </Label>
          <span className="text-[10px] text-muted font-mono truncate">
            {project.scriptSourcePath || "in-memory"}
          </span>
        </div>

        <Textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={20}
          className="font-mono text-xs flex-1 min-h-64"
          placeholder="Paste your Markdown script here…"
        />

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onSave}
            disabled={pending}
          >
            <Save className="size-4" /> Save
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onParse}
            disabled={pending}
          >
            <Wand2 className="size-4" /> Parse
          </Button>
        </div>

        {project.scriptSourcePath && (
          <Button
            type="button"
            variant="ghost"
            onClick={onLoadFromRepo}
            disabled={pending}
          >
            <FolderOpen className="size-4" /> Load from{" "}
            <span className="font-mono text-[11px] truncate">
              {project.scriptSourcePath}
            </span>
          </Button>
        )}

        <p className="text-[11px] text-muted leading-relaxed">
          Scenes split on horizontal rules (<code>---</code>) and{" "}
          <code>**SCENE N**</code> markers. Shots come from the{" "}
          <code>| 1.1 | type | duration | description |</code> table format.
        </p>
      </CardBody>
    </Card>
  );
}
