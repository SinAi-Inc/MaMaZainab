"use client";

import { useState, useTransition } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { CopyHexButton } from "./copy-hex-button";
import {
  BookOpen,
  Users,
  ShieldAlert,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Pencil,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { BrandCharacter, SceneMapping } from "@/lib/brand-bible-data";
import type { Character } from "@/lib/characters/schema";

type GenerationRules = {
  mandatory: string[];
  qualityGates: { check: string; rule: string }[];
};



function CharacterCard({ char }: { char: BrandCharacter }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  function copyAnchor() {
    startTransition(async () => {
      await navigator.clipboard.writeText(char.visualPromptAnchor);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={char.avatarSrc}
            alt={char.name}
            className="size-14 rounded-lg object-cover border border-border-strong flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{char.name}</h4>
              {char.nameArabic && (
                <span className="text-xs text-muted" dir="rtl">
                  {char.nameArabic}
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">{char.role}</p>
            <p className="text-sm text-brand-ink mt-1">{char.descriptionShort}</p>
          </div>
        </div>

        {/* Personality chips */}
        <div className="flex flex-wrap gap-1.5">
          {char.personality.map((p) => (
            <span
              key={p}
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green-deep"
            >
              {p}
            </span>
          ))}
        </div>

        {/* Signature line */}
        {char.signatureLine && (
          <blockquote className="border-l-2 border-brand-yellow pl-3 italic text-sm text-brand-ink/70">
            &ldquo;{char.signatureLine}&rdquo;
          </blockquote>
        )}

        {/* Prompt anchor (copyable) */}
        <div className="relative bg-zinc-50 border border-border rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-1">
            Visual Prompt Anchor
          </p>
          <p className="text-xs text-brand-ink leading-relaxed pr-8">
            {char.visualPromptAnchor}
          </p>
          <button
            onClick={copyAnchor}
            title="Copy prompt anchor"
            className="absolute top-3 right-3 text-muted hover:text-brand-green-deep transition-colors"
          >
            {copied ? <Check className="size-3.5 text-brand-green" /> : <Copy className="size-3.5" />}
          </button>
        </div>

        {/* Toggle details */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs text-muted hover:text-brand-green-deep transition-colors"
        >
          {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          {open ? "Hide details" : "Physical traits, wardrobe & rules"}
        </button>

        {open && (
          <div className="space-y-4 pt-1">
            {/* Physical traits */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-2">
                Physical Traits
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {Object.entries(char.physicalTraits).map(([k, v]) => (
                  <div key={k} className="flex gap-1.5">
                    <dt className="font-medium text-brand-ink shrink-0">{k}:</dt>
                    <dd className="text-muted">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Wardrobe */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-2">
                Wardrobe
              </p>
              <div className="space-y-2">
                {char.wardrobe.map((w) => (
                  <div
                    key={w.label}
                    className="bg-white border border-border rounded-md p-2.5"
                  >
                    <p className="text-xs font-semibold">{w.label}</p>
                    <p className="text-xs text-muted mt-0.5">{w.desc}</p>
                    {w.colors && (
                      <p className="text-[10px] font-mono text-muted mt-0.5">
                        Colors: {w.colors}
                      </p>
                    )}
                    {w.context && (
                      <p className="text-[10px] text-muted mt-0.5">
                        Context: {w.context}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* DO NOTs */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-red-600 font-medium mb-2 flex items-center gap-1">
                <ShieldAlert className="size-3" /> Do Not
              </p>
              <ul className="space-y-1">
                {char.doNots.map((d) => (
                  <li
                    key={d}
                    className="text-xs text-red-700/80 flex items-start gap-1.5"
                  >
                    <span className="text-red-400 mt-0.5">✕</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function CharactersPanel({ characters }: { characters: Character[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="size-4 text-brand-green-deep" />
        <h3 className="font-semibold">Cast Members</h3>
        <span className="text-xs text-muted ml-auto">
          {characters.length} character{characters.length !== 1 ? "s" : ""} · live from Character Bible
        </span>
        <Link
          href="/characters"
          className="text-xs text-brand-green-deep hover:underline flex items-center gap-1"
        >
          Manage <ExternalLink className="size-3" />
        </Link>
      </div>
      {characters.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-muted text-sm">
            <Users className="size-8 mx-auto mb-2 opacity-30" />
            No characters yet. <Link href="/characters/new" className="text-brand-green-deep hover:underline">Add the first cast member</Link>.
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {characters.map((c) => (
            <LiveCharacterCard key={c.id} char={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function LiveCharacterCard({ char }: { char: Character }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();
  const primary = char.referenceImages.find((r) => r.isPrimary) ?? char.referenceImages[0];

  function copyAnchor() {
    startTransition(async () => {
      await navigator.clipboard.writeText(char.anchorBlock);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className={char.active ? undefined : "opacity-60"}>
      <CardBody className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          {primary ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primary.url}
              alt={char.name}
              className="size-14 rounded-lg object-cover object-top border border-border-strong flex-shrink-0"
            />
          ) : (
            <div className="size-14 rounded-lg bg-zinc-100 border border-border flex-shrink-0 flex items-center justify-center">
              <Users className="size-6 text-zinc-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">{char.name}</h4>
              {!char.active && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-200 text-zinc-600">Inactive</span>
              )}
            </div>
            {char.subtitle && (
              <p className="text-xs text-muted italic mt-0.5">{char.subtitle}</p>
            )}
            {char.role && (
              <p className="text-xs text-foreground/80 mt-1 line-clamp-2">{char.role}</p>
            )}
          </div>
          <Link href={`/characters/${char.id}/edit`} className="text-muted hover:text-brand-green-deep" title="Edit character">
            <Pencil className="size-3.5" />
          </Link>
        </div>

        {/* Identity fields */}
        {char.identityFields.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {char.identityFields.map((f) => (
              <div key={f.field} className="flex gap-1.5">
                <dt className="font-medium text-brand-ink shrink-0">{f.field}:</dt>
                <dd className="text-muted truncate">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Anchor block */}
        {char.anchorBlock && (
          <div className="relative bg-zinc-50 border border-border rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-1">
              Visual Prompt Anchor
            </p>
            <p className="text-xs text-brand-ink leading-relaxed pr-8 whitespace-pre-wrap">
              {char.anchorBlock}
            </p>
            <button
              onClick={copyAnchor}
              title="Copy prompt anchor"
              className="absolute top-3 right-3 text-muted hover:text-brand-green-deep transition-colors"
            >
              {copied ? <Check className="size-3.5 text-brand-green" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        )}

        {/* Modes */}
        {char.modes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {char.modes.map((m) => (
              <span key={m.label} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green-deep">
                {m.label}
              </span>
            ))}
          </div>
        )}

        {/* Toggle dos/donts */}
        {(char.dos.length > 0 || char.donts.length > 0) && (
          <>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1 text-xs text-muted hover:text-brand-green-deep transition-colors"
            >
              {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              {open ? "Hide rules" : "Dos & Don'ts"}
            </button>
            {open && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                {char.dos.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-brand-green-deep font-medium mb-1.5">Do</p>
                    <ul className="space-y-1">
                      {char.dos.map((d) => (
                        <li key={d} className="text-xs text-foreground/80 flex items-start gap-1.5">
                          <span className="text-brand-green mt-0.5">&#10003;</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {char.donts.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-red-600 font-medium mb-1.5 flex items-center gap-1">
                      <ShieldAlert className="size-3" /> Don't
                    </p>
                    <ul className="space-y-1">
                      {char.donts.map((d) => (
                        <li key={d} className="text-xs text-red-700/80 flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5">&#10007;</span>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}



function SceneRow({ scene }: { scene: SceneMapping }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-surface transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{scene.label}</p>
          <p className="text-xs text-muted mt-0.5 truncate">{scene.mood}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {scene.paletteFocus.slice(0, 3).map((c) => {
            const hex = c.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? "#999";
            return (
              <div
                key={c}
                className="size-4 rounded-full border border-border"
                style={{ backgroundColor: hex }}
                title={c}
              />
            );
          })}
          {open ? <ChevronUp className="size-4 text-muted" /> : <ChevronDown className="size-4 text-muted" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-border bg-zinc-50/50">
          <div className="pt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <p className="font-medium text-muted uppercase tracking-wider text-[10px] mb-1">
                Characters
              </p>
              <p>{scene.characters.join(", ")}</p>
            </div>
            <div>
              <p className="font-medium text-muted uppercase tracking-wider text-[10px] mb-1">
                Wong Mode
              </p>
              <p>{scene.wongMode ?? "—"}</p>
            </div>
            <div>
              <p className="font-medium text-muted uppercase tracking-wider text-[10px] mb-1">
                Pattern Usage
              </p>
              <p>{scene.patternUsage}</p>
            </div>
            <div>
              <p className="font-medium text-muted uppercase tracking-wider text-[10px] mb-1">
                Palette Focus
              </p>
              <p>{scene.paletteFocus.join(", ")}</p>
            </div>
          </div>
          {scene.brandElements.length > 0 && (
            <div className="text-xs">
              <p className="font-medium text-muted uppercase tracking-wider text-[10px] mb-1">
                Key Brand Elements
              </p>
              <div className="flex flex-wrap gap-1.5">
                {scene.brandElements.map((e) => (
                  <span
                    key={e}
                    className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green-deep text-[10px]"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ScenesRulesPanel({
  scenes,
  generationRules,
}: {
  scenes: SceneMapping[];
  generationRules: GenerationRules;
}) {
  const [showRules, setShowRules] = useState(true);

  return (
    <div className="space-y-6">
      {/* Scenes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="size-4 text-brand-green-deep" />
          <h3 className="font-semibold">Scene-to-Brand Mapping</h3>
          <span className="text-xs text-muted ml-auto">6 video scenes</span>
        </div>
        <p className="text-sm text-muted mb-4">
          Each scene specifies required characters, Wong's mode, palette focus,
          pattern usage, and mood — auto-applied when selecting a scene in Studio.
        </p>
        <div className="space-y-2">
          {scenes.map((s) => (
            <SceneRow key={s.id} scene={s} />
          ))}
        </div>
      </div>

      {/* Generation Rules */}
      <Card>
        <CardBody>
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full flex items-center gap-2 text-left"
          >
            <ShieldAlert className="size-4 text-red-500" />
            <h3 className="font-semibold flex-1">Generation Rules</h3>
            {showRules ? (
              <EyeOff className="size-4 text-muted" />
            ) : (
              <Eye className="size-4 text-muted" />
            )}
          </button>
          {showRules && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-2">
                  Mandatory Rules
                </p>
                <ul className="space-y-1.5">
                  {generationRules.mandatory.map((r) => {
                    const isNever = r.startsWith("NEVER");
                    return (
                      <li
                        key={r}
                        className={`text-xs flex items-start gap-2 ${
                          isNever ? "text-red-700/80" : "text-brand-ink"
                        }`}
                      >
                        <span className={`mt-0.5 ${isNever ? "text-red-400" : "text-brand-green"}`}>
                          {isNever ? "✕" : "✓"}
                        </span>
                        {r}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-2">
                  Quality Gates
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {generationRules.qualityGates.map((g) => (
                    <div
                      key={g.check}
                      className="bg-white border border-border rounded-md p-2.5"
                    >
                      <p className="text-xs font-semibold">{g.check}</p>
                      <p className="text-xs text-muted mt-0.5">{g.rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
