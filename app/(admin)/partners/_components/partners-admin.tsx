"use client";

import { useState, useTransition, useEffect } from "react";
import { Eye, EyeOff, Save, MapPin, Presentation, Utensils, BookOpen, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPartnerSettings, updatePartnerSettings } from "@/lib/partners/actions";
import type { PartnerSettings } from "@/lib/partners/schema";
import type { Branch } from "@/lib/branches/schema";

export function PartnersAdmin({ branches }: { branches: Branch[] }) {
  const [settings, setSettings] = useState<PartnerSettings | null>(null);
  const [showPasscode, setShowPasscode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getPartnerSettings().then(setSettings);
  }, []);

  if (!settings) {
    return <div className="text-sm text-muted py-8 text-center">Loading partner settings…</div>;
  }

  function toggle(key: keyof PartnerSettings) {
    setSettings((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
    setSaved(false);
  }

  function toggleLocation(id: string) {
    setSettings((prev) => {
      if (!prev) return prev;
      const ids = prev.featuredLocationIds.includes(id)
        ? prev.featuredLocationIds.filter((x) => x !== id)
        : [...prev.featuredLocationIds, id];
      return { ...prev, featuredLocationIds: ids };
    });
    setSaved(false);
  }

  function handleSave() {
    if (!settings) return;
    startTransition(async () => {
      await updatePartnerSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-8">
      {/* Portal URL + master toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Partner Portal</h3>
          <p className="text-xs text-muted mt-0.5">
            Control what partners see at{" "}
            <a href="/partner-portal" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline inline-flex items-center gap-0.5">
              /partner-portal <ExternalLink className="size-3" />
            </a>
          </p>
        </div>
        <ToggleSwitch
          checked={settings.portalEnabled}
          onChange={() => toggle("portalEnabled")}
          label="Portal Enabled"
        />
      </div>

      <div className={cn("space-y-6 transition-opacity", !settings.portalEnabled && "opacity-40 pointer-events-none")}>
        {/* Passcode */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <h4 className="text-xs uppercase tracking-wider font-medium text-muted">Access Passcode</h4>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <input
                type={showPasscode ? "text" : "password"}
                value={settings.passcode}
                onChange={(e) => {
                  setSettings({ ...settings, passcode: e.target.value });
                  setSaved(false);
                }}
                placeholder="Set a passcode for partners"
                className="w-full pl-3 pr-10 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-brand-green transition"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition"
              >
                {showPasscode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted">
            Partners enter this passcode on the portal login screen. Leave empty to block all access.
          </p>
        </div>

        {/* Section toggles */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h4 className="text-xs uppercase tracking-wider font-medium text-muted">Portal Sections</h4>
          <div className="space-y-3">
            <SectionToggle
              icon={BookOpen}
              label="Brand Overview"
              description="Logo, tagline, and key statistics"
              checked={settings.showBrandOverview}
              onChange={() => toggle("showBrandOverview")}
            />
            <SectionToggle
              icon={Presentation}
              label="Brand Presentation"
              description="Presentation deck (placeholder for now)"
              checked={settings.showPresentation}
              onChange={() => toggle("showPresentation")}
            />
            <SectionToggle
              icon={MapPin}
              label="Kiosk Locations"
              description="Show kiosk locations and status"
              checked={settings.showLocations}
              onChange={() => toggle("showLocations")}
            />
            <SectionToggle
              icon={Utensils}
              label="Menu Preview"
              description="Link to the public menu preview"
              checked={settings.showMenu}
              onChange={() => toggle("showMenu")}
            />
          </div>
        </div>

        {/* Featured locations */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h4 className="text-xs uppercase tracking-wider font-medium text-muted">Featured Locations</h4>
          <p className="text-[11px] text-muted">
            Select which kiosks appear on the partner portal. If none selected, all locations are shown.
          </p>
          <div className="space-y-2">
            {branches.map((b) => (
              <label
                key={b.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition",
                  settings.featuredLocationIds.includes(b.id)
                    ? "border-brand-green bg-brand-green/5"
                    : "border-border hover:border-brand-green/30",
                )}
              >
                <input
                  type="checkbox"
                  checked={settings.featuredLocationIds.includes(b.id)}
                  onChange={() => toggleLocation(b.id)}
                  className="accent-brand-green"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">{b.name}</span>
                  <span className="text-xs text-muted ml-2">Kiosk #{b.kioskNumber}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted">
                  {b.status}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-green text-white text-sm font-medium hover:bg-brand-green-deep transition disabled:opacity-50"
        >
          <Save className="size-4" />
          {isPending ? "Saving…" : "Save Settings"}
        </button>
        {saved && (
          <span className="text-xs text-brand-green font-medium">✓ Saved</span>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────── */

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer",
        checked ? "bg-brand-green" : "bg-gray-300",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

function SectionToggle({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className={cn("size-8 rounded-lg flex items-center justify-center", checked ? "bg-brand-green/10 text-brand-green" : "bg-gray-100 text-gray-400")}>
          <Icon className="size-4" />
        </div>
        <div>
          <span className="text-sm font-medium">{label}</span>
          <p className="text-[11px] text-muted">{description}</p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}
