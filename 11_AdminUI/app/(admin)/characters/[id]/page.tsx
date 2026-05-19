import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Pencil,
  ArrowLeft,
  Copy,
  Users,
  Mic,
  Image as ImageIcon,
} from "lucide-react";
import { readCharacters } from "@/lib/characters/store";
import { VISIBILITY_META, type CharacterVisibility } from "@/lib/characters/schema";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CopyAnchorButton } from "./_components/copy-anchor-button";
import { DeleteCharacterButton } from "./_components/delete-character-button";

export const dynamic = "force-dynamic";

function VisibilityBadge({ v }: { v: CharacterVisibility }) {
  const meta = VISIBILITY_META[v];
  const tones = {
    success: "bg-brand-green/15 text-brand-green-deep",
    info:    "bg-blue-100 text-blue-700",
    warning: "bg-brand-yellow/30 text-brand-ink",
    neutral: "bg-zinc-200 text-zinc-700",
  };
  return (
    <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full", tones[meta.tone])}>
      {meta.label}
    </span>
  );
}

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const state = await readCharacters();
  const char = state.characters.find((c) => c.id === id);
  if (!char) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/characters">
            <ArrowLeft className="size-4 mr-1.5" /> All Characters
          </Link>
        </Button>
        <div className="flex gap-2">
          <DeleteCharacterButton id={char.id} name={char.name} />
          <Button asChild>
            <Link href={`/characters/${char.id}/edit`}>
              <Pencil className="size-4 mr-1.5" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="flex gap-6 items-start">
        <div className="w-40 h-52 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0 shadow">
          {char.referenceImages.find((r) => r.isPrimary) || char.referenceImages[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(char.referenceImages.find((r) => r.isPrimary) ?? char.referenceImages[0]).url}
              alt={char.name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="size-12 text-zinc-300" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{char.name}</h1>
            <VisibilityBadge v={char.visibility} />
            {!char.active && (
              <span className="px-2.5 py-1 text-xs bg-zinc-200 text-zinc-600 rounded-full">Inactive</span>
            )}
          </div>
          {char.subtitle && <p className="text-muted italic">{char.subtitle}</p>}
          {char.role && <p className="text-foreground/80 text-sm max-w-xl">{char.role}</p>}
          {char.surfaceUsage && (
            <p className="text-xs text-muted max-w-xl pt-1">{char.surfaceUsage}</p>
          )}
        </div>
      </div>

      {/* AI Anchor Block */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted">AI Anchor Block</h2>
            <CopyAnchorButton text={char.anchorBlock} />
          </div>
          {char.anchorBlock ? (
            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed bg-zinc-50 rounded-lg p-4 border border-border text-zinc-700">
              {char.anchorBlock}
            </pre>
          ) : (
            <p className="text-sm text-muted italic">No anchor block defined yet.</p>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Reference Images */}
        <Card>
          <CardBody>
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted mb-3 flex items-center gap-1.5">
              <ImageIcon className="size-4" /> References ({char.referenceImages.length})
            </h2>
            {char.referenceImages.length === 0 ? (
              <p className="text-sm text-muted italic">No references.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {char.referenceImages.map((ref, i) => (
                  <div key={i} className="relative group">
                    <div className="w-20 h-24 rounded-lg overflow-hidden border border-border bg-zinc-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ref.url} alt={ref.label || `ref ${i + 1}`} className="w-full h-full object-cover object-top" />
                    </div>
                    {ref.isPrimary && (
                      <span className="absolute -top-1.5 -right-1.5 bg-brand-yellow text-brand-ink text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        PRIMARY
                      </span>
                    )}
                    {ref.label && (
                      <p className="text-[10px] text-muted text-center mt-1 w-20 truncate">{ref.label}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Identity Card */}
        <Card>
          <CardBody>
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted mb-3">Identity Card</h2>
            {char.identityFields.length === 0 ? (
              <p className="text-sm text-muted italic">No identity fields.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {char.identityFields.map((f, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-1.5 pr-4 font-medium text-muted whitespace-nowrap w-1/3">{f.field}</td>
                      <td className="py-1.5 text-foreground/80">{f.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        {/* Appearance Modes */}
        {char.modes.length > 0 && (
          <Card className="md:col-span-2">
            <CardBody>
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted mb-3">Appearance Modes</h2>
              <div className="grid grid-cols-2 gap-4">
                {char.modes.map((mode, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 space-y-1">
                    <h3 className="font-semibold text-sm">{mode.label}</h3>
                    {mode.when    && <p className="text-xs text-muted">When: {mode.when}</p>}
                    {mode.costume && <p className="text-xs text-foreground/80">Costume: {mode.costume}</p>}
                    {mode.posture && <p className="text-xs text-foreground/80">Posture: {mode.posture}</p>}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Voice */}
        <Card>
          <CardBody>
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted mb-3 flex items-center gap-1.5">
              <Mic className="size-4" /> Voice
            </h2>
            <div className="space-y-1 text-sm">
              {char.voiceProvider && (
                <p><span className="font-medium text-muted">Provider:</span> {char.voiceProvider}</p>
              )}
              {char.voiceId && (
                <p><span className="font-medium text-muted">ID:</span> <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">{char.voiceId}</code></p>
              )}
              {char.voiceNotes && (
                <p className="text-foreground/80 pt-1">{char.voiceNotes}</p>
              )}
              {!char.voiceProvider && !char.voiceNotes && (
                <p className="text-muted italic">No voice configuration.</p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Do / Don't */}
        <Card>
          <CardBody>
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted mb-3">Do / Don&apos;t Rules</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-brand-green-deep mb-1.5">✅ Do</p>
                {char.dos.length === 0 ? (
                  <p className="text-xs text-muted italic">None.</p>
                ) : (
                  <ul className="space-y-1">
                    {char.dos.map((d, i) => (
                      <li key={i} className="text-xs text-foreground/80 flex gap-1.5">
                        <span className="text-brand-green mt-0.5 flex-shrink-0">·</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-red mb-1.5">❌ Don&apos;t</p>
                {char.donts.length === 0 ? (
                  <p className="text-xs text-muted italic">None.</p>
                ) : (
                  <ul className="space-y-1">
                    {char.donts.map((d, i) => (
                      <li key={i} className="text-xs text-foreground/80 flex gap-1.5">
                        <span className="text-brand-red mt-0.5 flex-shrink-0">·</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
