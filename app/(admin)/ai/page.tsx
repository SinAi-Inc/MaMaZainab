import { readCharacters } from "@/lib/characters/store";
import { readBranches } from "@/lib/branches/store";
import { StudioTabs } from "./_components/studio-tabs";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const [{ characters }, { branches }] = await Promise.all([
    readCharacters(),
    readBranches(),
  ]);

  return <StudioTabs characters={characters} branches={branches} />;
}
