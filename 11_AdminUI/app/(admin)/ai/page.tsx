import { readCharacters } from "@/lib/characters/store";
import { readMenu } from "@/lib/menu/store";
import { nimAvailable } from "@/lib/nvidia/client";
import { getProviderSummaries } from "@/lib/video/provider-info";
import { readStudio } from "@/lib/videos/store";
import { StudioShell, type SectionId, type ProjectSummary } from "./_components/studio-shell";

export const dynamic = "force-dynamic";

const VALID_VIEWS: SectionId[] = [
  "projects",
  "workbench",
  "storyboard",
  "cast",
  "bible",
  "history",
  "delivery",
];

export default async function StudioPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; project?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const initialView: SectionId = VALID_VIEWS.includes(params.view as SectionId)
    ? (params.view as SectionId)
    : "workbench";
  const initialProject = typeof params.project === "string" ? params.project : "";

  const [{ characters }, { categories, items }, videoProviders, studio] = await Promise.all([
    readCharacters(),
    readMenu(),
    getProviderSummaries(),
    readStudio(),
  ]);
  const nvidiaKeySet = !!(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.length > 0);
  const hasNim = nimAvailable();

  const projects: ProjectSummary[] = [...studio.projects]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .map((p) => {
      const shots = studio.shots.filter((s) => s.projectId === p.id);
      return {
        id: p.id,
        title: p.title,
        logline: p.logline,
        status: p.status,
        aspectRatio: p.aspectRatio,
        targetDurationSec: p.targetDurationSec,
        defaultModel: p.defaultModel,
        posterUrl: p.posterUrl,
        tags: p.tags,
        updatedAt: p.updatedAt,
        scenes: studio.scenes.filter((s) => s.projectId === p.id).length,
        shots: shots.length,
        takes: studio.takes.filter((t) => t.projectId === p.id).length,
        approved: shots.filter((s) => s.status === "approved").length,
      };
    });

  return (
    <StudioShell
      characters={characters}
      menuCategories={categories}
      menuItems={items}
      nvidiaKeySet={nvidiaKeySet}
      nimAvailable={hasNim}
      videoProviders={videoProviders}
      projects={projects}
      scenes={studio.scenes}
      shots={studio.shots}
      takes={studio.takes}
      initialView={initialView}
      initialProject={initialProject}
    />
  );
}

