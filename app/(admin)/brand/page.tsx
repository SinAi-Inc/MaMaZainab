import { Palette, FileJson, Type, Image as ImageIcon, Grid3X3 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { CopyHexButton } from "./_components/copy-hex-button";
import { BrandTabs } from "./_components/brand-tabs";

type ColorToken = {
  name: string;
  token: string;
  hex: string;
  rgb: string;
  role: string;
};

const PRIMARY_COLORS: ColorToken[] = [
  {
    name: "Brand Green",
    token: "brand.green",
    hex: "#1B9B00",
    rgb: "27, 155, 0",
    role: "PRIMARY (base) - vine leaves, freshness",
  },
  {
    name: "Brand Yellow",
    token: "brand.yellow",
    hex: "#EFD200",
    rgb: "239, 210, 0",
    role: "SECONDARY (accent) - warmth, generosity",
  },
  {
    name: "Brand Black",
    token: "brand.black",
    hex: "#000000",
    rgb: "0, 0, 0",
    role: "Strength, body text",
  },
  {
    name: "Brand White",
    token: "brand.white",
    hex: "#FFFFFF",
    rgb: "255, 255, 255",
    role: "Surface",
  },
];

const EXTENDED_COLORS: ColorToken[] = [
  {
    name: "Green Deep",
    token: "extended.greenDeep",
    hex: "#169216",
    rgb: "22, 146, 22",
    role: "Hover / dark green variant",
  },
  {
    name: "Cream",
    token: "extended.cream",
    hex: "#F0F4EB",
    rgb: "240, 244, 235",
    role: "Warm off-white surface",
  },
  {
    name: "Alert Red",
    token: "extended.alertRed",
    hex: "#E60000",
    rgb: "230, 0, 0",
    role: "\"STOP\" disruption campaign only",
  },
  {
    name: "Ink",
    token: "extended.ink",
    hex: "#2C292A",
    rgb: "44, 41, 42",
    role: "Softer body text",
  },
  {
    name: "Muted Grey",
    token: "extended.mutedGrey",
    hex: "#B7B7B7",
    rgb: "183, 183, 183",
    role: "Dividers / disabled",
  },
];

function ColorSwatch({ color }: { color: ColorToken }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="size-16 rounded-lg border border-border-strong flex-shrink-0 shadow-sm"
        style={{ backgroundColor: color.hex }}
        title={color.hex}
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{color.name}</h4>
        <p className="text-xs font-mono text-muted mt-0.5">{color.token}</p>
        <div className="flex items-center gap-3 mt-1 text-xs">
          <span className="font-mono">{color.hex}</span>
          <span className="text-muted">RGB {color.rgb}</span>
          <CopyHexButton hex={color.hex} />
        </div>
        <p className="text-xs text-muted mt-1">{color.role}</p>
      </div>
    </div>
  );
}

export default function BrandTokensPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          Brand System v2026.05.0
        </p>
        <h2 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          <Palette className="size-5 text-brand-green-deep" />
          Brand Tokens
        </h2>
        <p className="text-sm text-muted mt-1">
          Design tokens, color palette, typography, and plaid patterns.
          Single source of truth for all UI, packaging, signage, video, and
          marketing.
        </p>
      </div>

      <BrandTabs
        tabs={[
          { id: "colors", label: "Colors & Typography", icon: <Palette className="size-4" /> },
          { id: "plaid", label: "Plaid Pattern", icon: <Grid3X3 className="size-4" /> },
        ]}
      >
        {{
          colors: <ColorsTypographyPanel />,
          plaid: <PlaidPatternPanel />,
        }}
      </BrandTabs>
    </div>
  );
}

/* ────────────── Colors & Typography Panel ────────────── */

function ColorsTypographyPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">Primary Palette (locked HEX)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {PRIMARY_COLORS.map((c) => (
              <ColorSwatch key={c.token} color={c} />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Extended Palette */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">
            Extended Palette (sampled from guideline)
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {EXTENDED_COLORS.map((c) => (
              <ColorSwatch key={c.token} color={c} />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Full tokens file */}
      <Card>
        <CardBody>
          <div className="flex items-start gap-3">
            <FileJson className="size-5 text-brand-green-deep flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold">Full Token System</h3>
              <p className="text-sm text-muted mt-1">
                Complete brand system including typography, spacing, logos,
                and usage rules available in{" "}
                <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">
                  01_Brand/BRAND.md
                </code>{" "}
                and{" "}
                <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">
                  01_Brand/tokens.json
                </code>
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Typography */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Type className="size-4 text-brand-green-deep" />
            Typography
          </h3>
          <div className="space-y-5">
            {/* Display */}
            <div className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted font-medium">Display / Brand</span>
                <code className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded font-mono">--font-brand · var(--font-brand)</code>
              </div>
              <p className="font-[family-name:var(--font-brand)] text-5xl text-brand-ink leading-none">
                MaMa Zainab
              </p>
              <p className="text-xs text-muted">Chinese Monoline — headlines, logo wordmark, section titles. Never body text.</p>
            </div>

            {/* Body */}
            <div className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted font-medium">Body / UI</span>
                <code className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded font-mono">--font-sans · Poppins</code>
              </div>
              <p className="font-sans text-lg text-brand-ink leading-relaxed">
                Homemade taste. Fast-food style — for the first time.
              </p>
              <div className="flex gap-4 text-sm font-sans">
                <span className="font-light">Light 300</span>
                <span className="font-normal">Regular 400</span>
                <span className="font-medium">Medium 500</span>
                <span className="font-semibold">SemiBold 600</span>
                <span className="font-bold">Bold 700</span>
              </div>
              <p className="text-xs text-muted">Poppins — all UI, labels, descriptions, pricing. Google Fonts, loaded on first request.</p>
            </div>

            {/* Arabic */}
            <div className="border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted font-medium">Arabic</span>
                <code className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded font-mono">--font-arabic · Cairo</code>
              </div>
              <p className="font-[family-name:var(--font-arabic)] text-2xl text-brand-ink text-right" dir="rtl">
                ماما زينب — طعم بيتي بأسلوب الفاست فود
              </p>
              <p className="text-xs text-muted">Cairo — all Arabic text, RTL layouts, kiosk screens. Supports Arabic + Latin subsets.</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Logos */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="size-4 text-brand-green-deep" />
            Logo Assets
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { src: "/brand/logo-primary.png", label: "Primary (on light)", bg: "bg-brand-cream" },
              { src: "/brand/logo-on-dark.png", label: "On dark", bg: "bg-brand-ink" },
              { src: "/brand/logo-wordmark-transparent.png", label: "Wordmark (transparent)", bg: "bg-brand-green" },
              { src: "/brand/logo-mono.png", label: "Mono", bg: "bg-zinc-100" },
            ].map(({ src, label, bg }) => (
              <div key={src} className="space-y-2">
                <div className={`${bg} rounded-lg p-4 flex items-center justify-center h-24 border border-border`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={label} className="max-h-full max-w-full object-contain" />
                </div>
                <p className="text-xs text-center text-muted">{label}</p>
              </div>
            ))}
          </div>

          {/* Mark variants */}
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">Mark / Icon</p>
            <div className="flex gap-4 flex-wrap">
              {[
                { src: "/brand/mark.png", label: "Default", bg: "bg-white" },
                { src: "/brand/mark-transparent.png", label: "Transparent", bg: "bg-brand-green" },
                { src: "/brand/mark-avatar.png", label: "Avatar (circle)", bg: "bg-brand-cream" },
              ].map(({ src, label, bg }) => (
                <div key={src} className="space-y-1 text-center">
                  <div className={`${bg} rounded-xl p-3 size-20 flex items-center justify-center border border-border mx-auto`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={label} className="max-h-full max-w-full object-contain" />
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

/* ────────────── Plaid Pattern Panel ────────────── */

const PLAID_VARIANTS = [
  {
    name: "Web",
    file: "tile_gingham_web.png",
    swatch: "swatch_web.png",
    cell: "32px",
    use: "Website heroes, app backgrounds, digital banners",
  },
  {
    name: "Packaging",
    file: "tile_gingham_packaging.png",
    swatch: "swatch_packaging.png",
    cell: "48px",
    use: "Boxes, bags, wrapping paper, side panels",
  },
  {
    name: "Apron",
    file: "tile_gingham_apron.png",
    swatch: "swatch_apron.png",
    cell: "64px",
    use: "Staff aprons, tablecloths, napkins, merch",
  },
];

function PlaidPatternPanel() {
  return (
    <div className="space-y-6">
      {/* Intro + live tile */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-2">Brand Plaid — Checkerboard</h3>
          <p className="text-sm text-muted mb-1">
            Alternating <strong className="text-brand-green-deep">brand green</strong> +{" "}
            <strong className="text-yellow-600">brand yellow</strong> squares.
            Clean, bold, and recognizable — the signature MaMa Zainab pattern
            used across aprons, packaging, web, and all brand surfaces.
          </p>
          <p className="text-xs text-muted mb-4">
            Locked as of 2026-05. Matches the apron / uniform reference.
          </p>
          <div className="plaid h-48 rounded-lg border border-border-strong" />
        </CardBody>
      </Card>

      {/* Density variants */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-4">Density Variants</h3>
          <p className="text-sm text-muted mb-4">
            Three cell sizes tuned for different surfaces. Smaller cells for
            digital, larger for physical textiles where the weave should be visible.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {PLAID_VARIANTS.map((v) => (
              <div key={v.name} className="space-y-3">
                <div className="rounded-lg border border-border overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/brand/plaid/${v.swatch}`}
                    alt={`${v.name} plaid swatch`}
                    className="w-full h-auto"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{v.name}</h4>
                  <p className="text-xs text-muted mt-0.5">Cell: {v.cell}</p>
                  <p className="text-xs text-muted mt-0.5">{v.use}</p>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Contact sheet overview */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-2">Density Comparison (Contact Sheet)</h3>
          <p className="text-sm text-muted mb-4">
            All three checkerboard densities side by side: web (32px),
            packaging (48px), apron (64px).
          </p>
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

      {/* CSS usage */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-2">CSS Usage</h3>
          <p className="text-sm text-muted mb-3">
            Apply the <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">.plaid</code> class
            to any element. Adjust opacity for subtle washes.
          </p>
          <pre className="bg-zinc-50 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`.plaid {
  background-image: url('/brand/plaid.png');
  background-repeat: repeat;
  background-size: 384px 384px;
}

/* Subtle wash behind content */
.plaid-wash {
  @apply plaid opacity-[0.07] pointer-events-none;
}

/* Hero with dark vignette overlay */
<div class="plaid relative">
  <div class="absolute inset-0 bg-gradient-to-b
    from-black/55 to-black/70" />
  <div class="relative z-10">Content</div>
</div>`}
          </pre>
        </CardBody>
      </Card>

      {/* Color spec */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-2">Pattern Spec (from tokens.json)</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded border border-border" style={{ backgroundColor: "#1B9B00" }} />
              <div>
                <p className="text-xs font-semibold">Base</p>
                <p className="text-[11px] font-mono text-muted">#1B9B00</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded border border-border" style={{ backgroundColor: "#EFD200" }} />
              <div>
                <p className="text-xs font-semibold">Stripe</p>
                <p className="text-[11px] font-mono text-muted">#EFD200</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted">
            Pattern: checkerboard (alternating squares) ·
            Usage: apron, packaging, awning, web heroes, app onboarding
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

