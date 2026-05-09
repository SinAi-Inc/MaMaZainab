"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Check, ChevronDown } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Character } from "@/lib/characters/schema";
import { PALETTE_BLOCK, PLAID_BLOCK } from "@/lib/ai/brand-bible";

/* Builds the locked anchor block prompt for a character */
function buildCharacterPrompt(char: Character, style: string): string {
  const lines: string[] = [];

  // If the character has a pre-written anchor block, use it directly
  if (char.anchorBlock.trim()) {
    lines.push(char.anchorBlock.trim());
    lines.push(``);
  } else {
    // Derive anchor from structured fields
    lines.push(`[CHARACTER ANCHOR — ${char.name.toUpperCase()} — DO NOT ALTER]`);
    lines.push(`Name: ${char.name}`);
    if (char.subtitle) lines.push(`Role: ${char.subtitle}`);
    if (char.role) lines.push(`Description: ${char.role}`);
    for (const f of char.identityFields) {
      if (f.value) lines.push(`${f.field}: ${f.value}`);
    }
    if (char.voiceNotes) lines.push(`Voice / Tone: ${char.voiceNotes}`);
    if (char.dos.length) lines.push(`Appearance notes: ${char.dos.join(", ")}`);
    lines.push(`[/CHARACTER ANCHOR]`);
    lines.push(``);
  }

  lines.push(`Style modifier: ${style}`);
  lines.push(PALETTE_BLOCK);
  lines.push(`[PATTERN] ${PLAID_BLOCK}`);
  return lines.join("\n");
}

const STYLE_OPTIONS = [
  "Illustrated (flat vector, brand-consistent)",
  "Photorealistic (food photography grade)",
  "Cartoon / animated (bold outlines)",
  "Packaging mockup (wrap-around view)",
  "Social media post (16:9 landscape)",
  "Instagram story (9:16 portrait)",
];

export function CharacterPromptTool({ characters }: { characters: Character[] }) {
  const [charId, setCharId] = useState(characters[0]?.id ?? "");
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const char = characters.find((c) => c.id === charId);
  const prompt = char ? buildCharacterPrompt(char, style) : "";

  function handleCopy() {
    if (!prompt) return;
    startTransition(async () => {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Prompt copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className="border-brand-green/30 bg-brand-green/5">
      <CardBody className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-brand-green/15 flex items-center justify-center flex-shrink-0">
            <ChevronDown className="size-5 text-brand-green" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Character Prompt Generator</h3>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-green/15 text-brand-green-deep">
                Ready
              </span>
            </div>
            <p className="text-sm text-muted mt-1">
              Generate locked anchor blocks for AI prompting — keeps character identity stable across image generations.
            </p>
          </div>
        </div>

        {characters.length === 0 ? (
          <p className="text-sm text-muted italic">
            No characters defined yet. Add characters in the Characters section first.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1">
                  Character
                </label>
                <select
                  value={charId}
                  onChange={(e) => setCharId(e.target.value)}
                  className="w-full text-sm border border-border rounded-md px-2.5 py-1.5 bg-white"
                >
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wider block mb-1">
                  Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full text-sm border border-border rounded-md px-2.5 py-1.5 bg-white"
                >
                  {STYLE_OPTIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <pre className="text-xs font-mono bg-white border border-border rounded-lg p-3 whitespace-pre-wrap leading-relaxed text-brand-ink max-h-48 overflow-y-auto">
                {prompt}
              </pre>
            </div>

            <Button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied!" : "Copy Prompt"}
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
