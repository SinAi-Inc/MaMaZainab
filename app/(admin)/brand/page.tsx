import {
  Palette,
  Type,
  Image as ImageIcon,
  Grid3X3,
  BookOpen,
  Users,
  ShieldAlert,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { CopyHexButton } from "./_components/copy-hex-button";
import { BrandTabs } from "./_components/brand-tabs";
import { CharactersPanel, ScenesRulesPanel } from "./_components/brand-bible-panels";
import {
  BRAND_IDENTITY,
  COLORS,
  FONTS,
  PATTERN,
  PACKAGING,
  LOGO_ASSETS,
  type ColorToken,
} from "@/lib/brand-bible-data";

/* ──── Color Swatch ──── */

function ColorSwatch({ color }: { color: ColorToken }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="size-14 rounded-lg border border-border-strong flex-shrink-0 shadow-sm"
        style={{ backgroundColor: color.hex }}
        title={color.hex}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-sm">{color.name}</h4>
          {color.locked && (
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-brand-green/10 text-brand-green-deep">
              locked
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs">
          <span className="font-mono">{color.hex}</span>
          <span className="text-muted">
            RGB {color.rgb.join(", ")}
          </span>
          <CopyHexButton hex={color.hex} />
        </div>
        <p className="text-xs text-muted mt-0.5">{color.role}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {color.usage.map((u) => (
            <span
              key={u}
              className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 text-muted"
            >
              {u.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BrandBiblePage() {
  const primaryColors = COLORS.filter((c) => c.category === "primary");
  const secondaryColors = COLORS.filter((c) => c.category === "secondary");
  const extendedColors = COLORS.filter((c) => c.category === "extended");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          Brand System v2026.05.0
        </p>
        <h2 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          <BookOpen className="size-5 text-brand-green-deep" />
          Brand Bible
        </h2>
        <p className="text-sm text-muted mt-1">
          Complete brand reference — identity, colors, typography, patterns,
          characters, scenes, and generation rules. Single source of truth for
          all UI, packaging, signage, video, and marketing.
        </p>
      </div>

      {/* Identity strip */}
      <Card>
        <CardBody>
          <div className="flex items-start gap-4">
            <div className="size-16 rounded-xl bg-brand-green flex items-center justify-center flex-shrink-0 border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/mark-transparent.png"
                alt="MZ"
                className="size-12 object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {BRAND_IDENTITY.name}
                <span className="text-base text-muted font-normal" dir="rtl">
                  {BRAND_IDENTITY.nameArabic}
                </span>
              </h3>
              <p className="text-sm italic text-brand-green-deep mt-0.5">
                &ldquo;{BRAND_IDENTITY.tagline}&rdquo;
              </p>
              <p className="text-xs text-muted mt-1">
                {BRAND_IDENTITY.marketPosition} · {BRAND_IDENTITY.foundingCity}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {BRAND_IDENTITY.personality.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green-deep"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 6 Tabs */}
      <BrandTabs
        tabs={[
          { id: "colors", label: "Colors", icon: <Palette className="size-4" /> },
          { id: "typography", label: "Typography", icon: <Type className="size-4" /> },
          { id: "pattern", label: "Pattern", icon: <Grid3X3 className="size-4" /> },
          { id: "logos", label: "Logos", icon: <ImageIcon className="size-4" /> },
          { id: "characters", label: "Characters", icon: <Users className="size-4" /> },
          { id: "scenes", label: "Scenes & Rules", icon: <ShieldAlert className="size-4" /> },
        ]}
      >
        {{
          colors: (
            <ColorsPanel
              primary={primaryColors}
              secondary={secondaryColors}
              extended={extendedColors}
            />
          ),
          typography: <TypographyPanel />,
          pattern: <PlaidPatternPanel />,
          logos: <LogosPanel />,
          characters: <CharactersPanel />,
          scenes: <ScenesRulesPanel />,
        }}
      </BrandTabs>
    </div>
  );
}

/* ──────── Colors Panel ──────── */

function ColorsPanel({
  primary,
  secondary,
  extended,
}: {
  primary: ColorToken[];
  secondary: ColorToken[];
  extended: ColorToken[];
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">Primary Palette</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            {primary.map((c) => (
              <ColorSwatch key={c.id} color={c} />
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">Secondary Palette</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            {secondary.map((c) => (
              <ColorSwatch key={c.id} color={c} />
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">Extended Palette</h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {extended.map((c) => (
              <ColorSwatch key={c.id} color={c} />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/* ──────── Typography Panel ──────── */

function TypographyPanel() {
  return (
    <div className="space-y-5">
      {FONTS.map((f) => (
        <Card key={f.id}>
          <CardBody>
            <div className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs uppercase tracking-wider text-muted font-medium">
                  {f.role}
                </span>
                {f.cssVar && (
                  <code className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded font-mono">
                    {f.cssVar} · {f.family}
                  </code>
                )}
              </div>

              {/* Live preview */}
              {f.sampleText && f.cssVar && (
                <p
                  className={`text-brand-ink leading-relaxed ${
                    f.id === "display"
                      ? "font-[family-name:var(--font-brand)] text-5xl leading-none"
                      : f.id === "arabic"
                      ? "font-[family-name:var(--font-arabic)] text-2xl text-right"
                      : "font-sans text-lg"
                  }`}
                  dir={f.id === "arabic" ? "rtl" : undefined}
                >
                  {f.sampleText}
                </p>
              )}

              {/* Weights */}
              {f.weights.length > 1 && (
                <div className="flex gap-4 text-sm font-sans flex-wrap">
                  {f.weights.map((w) => (
                    <span
                      key={w}
                      className={
                        w === "Light"
                          ? "font-light"
                          : w === "Regular"
                          ? "font-normal"
                          : w === "Medium"
                          ? "font-medium"
                          : w === "SemiBold"
                          ? "font-semibold"
                          : w === "Bold"
                          ? "font-bold"
                          : ""
                      }
                    >
                      {w}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted">
                {f.family} — {f.usage}
              </p>
              <p className="text-[10px] text-muted">
                Fallback: {f.fallback}
              </p>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

/* ──────── Logos Panel ──────── */

function LogosPanel() {
  return (
    <div className="space-y-6">
      {/* Wordmark rules */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-3">Wordmark Rules</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <dt className="font-medium text-muted uppercase tracking-wider text-[10px]">
                Approved Spelling
              </dt>
              <dd className="font-semibold mt-0.5">
                {LOGO_ASSETS.wordmark.approvedSpelling}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted uppercase tracking-wider text-[10px]">
                Lock
              </dt>
              <dd className="mt-0.5">{LOGO_ASSETS.wordmark.lock}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted uppercase tracking-wider text-[10px]">
                Min Size
              </dt>
              <dd className="mt-0.5">
                Web: {LOGO_ASSETS.wordmark.minSizeWeb} · Print:{" "}
                {LOGO_ASSETS.wordmark.minSizePrint}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted uppercase tracking-wider text-[10px]">
                Clear Space
              </dt>
              <dd className="mt-0.5">{LOGO_ASSETS.wordmark.clearSpace}</dd>
            </div>
          </dl>
          <div className="mt-3">
            <p className="text-[10px] text-red-600 font-medium uppercase tracking-wider mb-1">
              Rejected Spellings
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LOGO_ASSETS.wordmark.rejected.map((r) => (
                <span
                  key={r}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 line-through"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Logo variants */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">Logo Variants</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {LOGO_ASSETS.variants.map(({ src, label, bg }) => (
              <div key={src} className="space-y-2">
                <div
                  className={`${bg} rounded-lg p-4 flex items-center justify-center h-24 border border-border`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={label}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <p className="text-xs text-center text-muted">{label}</p>
              </div>
            ))}
          </div>

          {/* Mark variants */}
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">
              Mark / Icon
            </p>
            <div className="flex gap-4 flex-wrap">
              {LOGO_ASSETS.marks.map(({ src, label, bg }) => (
                <div key={src} className="space-y-1 text-center">
                  <div
                    className={`${bg} rounded-xl p-3 size-20 flex items-center justify-center border border-border mx-auto`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={label}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/* ──────── Plaid Pattern Panel ──────── */

function PlaidPatternPanel() {
  return (
    <div className="space-y-6">
      {/* Intro + live tile */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-2">{PATTERN.name}</h3>
          <p className="text-sm text-muted mb-1">
            {PATTERN.description}
          </p>
          <p className="text-xs text-muted mb-1">
            Structure: {PATTERN.structure}
          </p>
          <p className="text-xs text-muted mb-4">
            Line weight: {PATTERN.lineWeight} · Diamond: {PATTERN.diamondSize}
          </p>
          <div className="plaid h-48 rounded-lg border border-border-strong" />
        </CardBody>
      </Card>

      {/* Prompt anchor */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-2">AI Prompt Anchor</h3>
          <div className="bg-zinc-50 border border-border rounded-lg p-3">
            <p className="text-xs font-mono text-brand-ink leading-relaxed">
              {PATTERN.promptAnchor}
            </p>
          </div>
          {PATTERN.doNots.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-wider text-red-600 font-medium mb-1">
                Do Not
              </p>
              <ul className="space-y-0.5">
                {PATTERN.doNots.map((d) => (
                  <li key={d} className="text-xs text-red-700/80 flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5">✕</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Usage contexts */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-3">Usage Contexts</h3>
          <div className="flex flex-wrap gap-1.5">
            {PATTERN.usage.map((u) => (
              <span
                key={u}
                className="text-xs px-2.5 py-1 rounded-full bg-brand-green/10 text-brand-green-deep"
              >
                {u}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Density variants */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">Density Variants</h3>
          <p className="text-sm text-muted mb-4">
            Three cell sizes tuned for different surfaces. Smaller cells for
            digital, larger for physical textiles.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {PATTERN.variants.map((v) => (
              <div key={v.name} className="space-y-3">
                <div className="rounded-lg border border-border overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.swatchPng}
                    alt={`${v.name} plaid swatch`}
                    className="w-full h-auto"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{v.name}</h4>
                  <p className="text-xs text-muted mt-0.5">Cell: {v.cellSize}</p>
                  <p className="text-xs text-muted mt-0.5">{v.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Contact sheet */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-2">Density Comparison (Contact Sheet)</h3>
          <div className="rounded-lg border border-border overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/plaid/contact_sheet.png"
              alt="Plaid variants contact sheet"
              className="w-full h-auto"
            />
          </div>
        </CardBody>
      </Card>

      {/* Color spec */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-2">Pattern Colors</h3>
          <div className="flex gap-4 mb-3">
            {PATTERN.colors.map((hex, i) => (
              <div key={hex} className="flex items-center gap-2">
                <div
                  className="size-8 rounded border border-border"
                  style={{ backgroundColor: hex }}
                />
                <div>
                  <p className="text-xs font-semibold">
                    {i === 0 ? "Base" : i === 1 ? "Weft" : "Cross"}
                  </p>
                  <p className="text-[11px] font-mono text-muted">{hex}</p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* CSS usage */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-2">CSS Usage</h3>
          <pre className="bg-zinc-50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`.plaid {
  background-image: url('/brand/plaid.png');
  background-repeat: repeat;
  background-size: 384px 384px;
}

.plaid-wash {
  @apply plaid opacity-[0.07] pointer-events-none;
}`}
          </pre>
        </CardBody>
      </Card>
    </div>
  );
}
