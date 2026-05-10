import { readCharacters } from "@/lib/characters/store";
import { StudioTabs } from "./_components/studio-tabs";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const { characters } = await readCharacters();
  const nvidiaKeySet = !!(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.length > 0);

  return <StudioTabs characters={characters} nvidiaKeySet={nvidiaKeySet} />;
}
