import { Palette, FileJson, Type, Image as ImageIcon, Copy } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { CopyHexButton } from "./_components/copy-hex-button";

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

      {/* Primary Palette */}
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

      {/* Plaid Pattern */}
      <Card>
        <CardBody>
          <h3 className="font-semibold mb-2">Plaid Pattern v2</h3>
          <p className="text-sm text-muted mb-4">
            <strong className="text-brand-green-deep">Green base</strong> + yellow
            stripes + white weft. Four density variants tuned per surface:
            apron, packaging, awning, web.
          </p>
          <div className="plaid h-32 rounded-lg border border-border-strong" />
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

