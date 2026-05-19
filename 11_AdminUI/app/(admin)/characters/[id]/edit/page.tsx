import { notFound } from "next/navigation";
import { readCharacters } from "@/lib/characters/store";
import { CharacterForm } from "../../_components/character-form";

export const dynamic = "force-dynamic";

export default async function EditCharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await readCharacters();
  const character = state.characters.find((c) => c.id === id);
  if (!character) notFound();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Edit — {character.name}</h1>
        <p className="text-muted text-sm mt-1">Update the character profile in the Brand Bible.</p>
      </div>
      <CharacterForm existing={character} />
    </div>
  );
}
