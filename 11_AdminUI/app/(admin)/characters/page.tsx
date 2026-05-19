import Link from "next/link";
import { Plus, Users, Pencil, Eye } from "lucide-react";
import { readCharacters } from "@/lib/characters/store";

export const dynamic = "force-dynamic";
import {
  VISIBILITY_META,
  type CharacterVisibility,
} from "@/lib/characters/schema";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function VisibilityBadge({ v }: { v: CharacterVisibility }) {
  const meta = VISIBILITY_META[v];
  const tones = {
    success: "bg-brand-green/15 text-brand-green-deep",
    info:    "bg-blue-100 text-blue-700",
    warning: "bg-brand-yellow/30 text-brand-ink",
    neutral: "bg-zinc-200 text-zinc-700",
  };
  return (
    <span className={cn("px-2 py-0.5 text-[11px] font-medium rounded-full", tones[meta.tone])}>
      {meta.label}
    </span>
  );
}

export default async function CharactersPage() {
  const state = await readCharacters();
  const characters = [...state.characters].sort((a, b) => a.sort - b.sort);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="size-6 text-brand-green" />
            Character Bible
          </h1>
          <p className="mt-1 text-sm text-muted">
            {characters.length} cast members · anchor blocks, references, voice &amp; rules
          </p>
        </div>
        <Button asChild>
          <Link href="/characters/new">
            <Plus className="size-4 mr-1.5" />
            New Character
          </Link>
        </Button>
      </div>

      {/* Grid */}
      {characters.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center text-muted">
            <Users className="size-10 mx-auto mb-3 opacity-30" />
            <p>No characters yet. Add the first cast member.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {characters.map((char) => {
            const primary = char.referenceImages.find((r) => r.isPrimary) ?? char.referenceImages[0];
            return (
              <Card
                key={char.id}
                className={cn(
                  "flex flex-col overflow-hidden transition-shadow hover:shadow-md",
                  !char.active && "opacity-60",
                )}
              >
                {/* Reference image */}
                <div className="relative h-52 bg-zinc-100 overflow-hidden">
                  {primary ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={primary.url}
                      alt={char.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Users className="size-12 text-zinc-300" />
                    </div>
                  )}
                  {!char.active && (
                    <div className="absolute inset-0 bg-zinc-900/40 flex items-center justify-center">
                      <span className="bg-zinc-800 text-white text-xs px-2 py-0.5 rounded-full">Inactive</span>
                    </div>
                  )}
                </div>

                <CardBody className="flex flex-col flex-1 gap-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold text-base leading-snug">{char.name}</h2>
                      <VisibilityBadge v={char.visibility} />
                    </div>
                    {char.subtitle && (
                      <p className="text-xs text-muted italic mt-0.5">{char.subtitle}</p>
                    )}
                  </div>

                  {char.role && (
                    <p className="text-xs text-foreground/80 line-clamp-2">{char.role}</p>
                  )}

                  <div className="flex gap-3 text-[11px] text-muted">
                    <span>{char.referenceImages.length} ref{char.referenceImages.length !== 1 ? "s" : ""}</span>
                    <span>{char.identityFields.length} ID fields</span>
                    {char.modes.length > 0 && <span>{char.modes.length} modes</span>}
                  </div>

                  {char.anchorBlock && (
                    <pre className="text-[10px] leading-relaxed bg-zinc-50 border border-border rounded p-2 line-clamp-3 whitespace-pre-wrap font-mono text-zinc-600 overflow-hidden">
                      {char.anchorBlock}
                    </pre>
                  )}

                  <div className="flex gap-2 mt-auto pt-1">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/characters/${char.id}`}>
                        <Eye className="size-3.5 mr-1" /> View
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/characters/${char.id}/edit`}>
                        <Pencil className="size-3.5 mr-1" /> Edit
                      </Link>
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
