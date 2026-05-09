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
} from "lucide-react";
import type { BrandCharacter, SceneMapping } from "@/lib/brand-bible-data";
import { CHARACTERS, SCENES, GENERATION_RULES } from "@/lib/brand-bible-data";

/* ──────── Characters Panel ──────── */

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

export function CharactersPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Users className="size-4 text-brand-green-deep" />
        <h3 className="font-semibold">Brand Characters</h3>
        <span className="text-xs text-muted ml-auto">
          {CHARACTERS.length} characters defined
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {CHARACTERS.map((c) => (
          <CharacterCard key={c.id} char={c} />
        ))}
      </div>
    </div>
  );
}

/* ──────── Scenes & Rules Panel ──────── */

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

export function ScenesRulesPanel() {
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
          {SCENES.map((s) => (
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
                  {GENERATION_RULES.mandatory.map((r) => {
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
                  {GENERATION_RULES.qualityGates.map((g) => (
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
