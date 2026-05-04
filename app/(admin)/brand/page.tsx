import { Palette, FileJson } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";

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
        <div className="flex gap-3 mt-1 text-xs">
          <span className="font-mono">{color.hex}</span>
          <span className="text-muted">RGB {color.rgb}</span>
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
              <p className="text-xs text-muted mt-2">
                <strong>Coming soon:</strong> Logo lockup generator, plaid
                pattern customizer, color contrast checker, typography
                previewer
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
