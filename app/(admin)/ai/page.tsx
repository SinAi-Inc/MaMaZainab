import { readCharacters } from "@/lib/characters/store";
import { StudioTabs } from "./_components/studio-tabs";

export default async function StudioPage() {
  const { characters } = await readCharacters();

  return <StudioTabs characters={characters} />;
}
