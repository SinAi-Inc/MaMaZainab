import { notFound } from "next/navigation";
import { readStudio } from "@/lib/videos/store";
import { EditProjectForm } from "./_components/edit-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await readStudio();
  const project = state.projects.find((p) => p.id === id);
  if (!project) notFound();
  return <EditProjectForm project={project} />;
}
