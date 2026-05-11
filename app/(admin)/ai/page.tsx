import { readCharacters } from "@/lib/characters/store";
import { readMenu } from "@/lib/menu/store";
import { nimAvailable } from "@/lib/nvidia/client";
import { StudioTabs } from "./_components/studio-tabs";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const { characters } = await readCharacters();
  const { categories, items } = await readMenu();
  const nvidiaKeySet = !!(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.length > 0);
  const hasNim = nimAvailable();

  return (
    <StudioTabs
      characters={characters}
      menuCategories={categories}
      menuItems={items}
      nvidiaKeySet={nvidiaKeySet}
      nimAvailable={hasNim}
    />
  );
}
