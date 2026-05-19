import { CharacterForm } from "../_components/character-form";

export default function NewCharacterPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">New Character</h1>
        <p className="text-muted text-sm mt-1">Add a character to the Brand Bible.</p>
      </div>
      <CharacterForm />
    </div>
  );
}
