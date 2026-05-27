"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Calendar,
  Eye,
  EyeOff,
  FileText,
  LinkIcon,
  Mail,
  MapPin,
  Phone,
  Presentation,
  Save,
  Utensils,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPartnerSettings, updatePartnerSettings } from "@/lib/partners/actions";
import type { PartnerSettings } from "@/lib/partners/schema";
import type { Branch } from "@/lib/branches/schema";

type BooleanSettingKey =
  | "portalEnabled"
  | "showBrandOverview"
  | "showPresentation"
  | "showLocations"
  | "showMenu";

type TextSettingKey =
  | "passcode"
  | "presentationTitle"
  | "presentationSubtitle"
  | "presentationFileUrl"
  | "presentationVersion"
  | "presentationUpdatedAt"
  | "contactEmail"
  | "contactPhone"
  | "bookingUrl"
  | "assessmentUrl";

function getPartnerSaveHelp(error: string): string | null {
  if (/partner_settings/i.test(error) && /(migration|missing|does not exist|42P01)/i.test(error)) {
    return "Run the partner_settings migration in your Supabase SQL Editor if this is the first time saving.";
  }

  if (/NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|Supabase is not configured/i.test(error)) {
    return "Set NEXT_PUBLIC_SUPABASE_URL and your server Supabase key in .env.local or your hosting environment, then restart local dev or redeploy.";
  }

  return null;
}

export function PartnersAdmin({ branches }: { branches: Branch[] }) {
  const [settings, setSettings] = useState<PartnerSettings | null>(null);
  const [showPasscode, setShowPasscode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveHelp = saveError ? getPartnerSaveHelp(saveError) : null;

  useEffect(() => {
    getPartnerSettings().then(setSettings);
  }, []);

  if (!settings) {
    return <div className="text-sm text-muted py-8 text-center">Loading partner settings…</div>;
  }

  function toggle(key: BooleanSettingKey) {
    setSettings((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
    setSaved(false);
  }

  function updateText(key: TextSettingKey, value: string) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
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
    setSaveError(null);
    startTransition(async () => {
      const result = await updatePartnerSettings(settings);
      if (result.error) {
        setSaveError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
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
                onChange={(e) => updateText("passcode", e.target.value)}
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
          {settings.passcodeConfigured ? (
            <p className="text-[11px] text-muted">
              A passcode is already configured. Leave this field empty to keep it unchanged, or enter a new one to rotate it.
            </p>
          ) : (
            <p className="text-[11px] text-muted">
              Partners enter this passcode on the portal login screen. Leave empty to block all access.
            </p>
          )}
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
              description="Presentation holder, slide canvas, and deck download"
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

        {/* Presentation download */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-medium text-muted">Presentation Download</h4>
            <p className="text-[11px] text-muted mt-1">
              Controls the title, version label, and downloadable deck shown in the partner portal.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              icon={Presentation}
              label="Presentation title"
              value={settings.presentationTitle}
              onChange={(value) => updateText("presentationTitle", value)}
              placeholder="MaMa Zainab Partner Presentation"
            />
            <TextField
              icon={FileText}
              label="Presentation version"
              value={settings.presentationVersion}
              onChange={(value) => updateText("presentationVersion", value)}
              placeholder="v0.1"
            />
            <TextField
              icon={LinkIcon}
              label="Presentation file URL"
              value={settings.presentationFileUrl}
              onChange={(value) => updateText("presentationFileUrl", value)}
              placeholder="/Mama-Zainab-Partners-Presentation.pdf"
            />
            <TextField
              icon={Calendar}
              label="Last updated date"
              value={settings.presentationUpdatedAt}
              onChange={(value) => updateText("presentationUpdatedAt", value)}
              placeholder="2026-05-27"
            />
            <TextField
              icon={BookOpen}
              label="Presentation subtitle"
              value={settings.presentationSubtitle}
              onChange={(value) => updateText("presentationSubtitle", value)}
              placeholder="Authentic Mahshi. Homemade Taste. Fast-Food Speed."
              className="md:col-span-2"
            />
          </div>
        </div>

        {/* Contact / CTA */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-medium text-muted">Contact &amp; CTA</h4>
            <p className="text-[11px] text-muted mt-1">
              Powers the partner portal buttons for meetings, tastings, and location assessment.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              icon={Mail}
              label="Partnership email"
              value={settings.contactEmail}
              onChange={(value) => updateText("contactEmail", value)}
              placeholder="hello@mamazainab.com"
            />
            <TextField
              icon={Phone}
              label="Phone / WhatsApp"
              value={settings.contactPhone}
              onChange={(value) => updateText("contactPhone", value)}
              placeholder="+20..."
            />
            <TextField
              icon={Calendar}
              label="Book meeting / tasting URL"
              value={settings.bookingUrl}
              onChange={(value) => updateText("bookingUrl", value)}
              placeholder="https://cal.com/..."
            />
            <TextField
              icon={MapPin}
              label="Location assessment URL"
              value={settings.assessmentUrl}
              onChange={(value) => updateText("assessmentUrl", value)}
              placeholder="https://forms..."
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
      <div className="space-y-2">
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
            <span className="text-xs text-brand-green font-medium">✓ Saved successfully</span>
          )}
        </div>
        {saveError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <strong>Save failed:</strong> {saveError}
            {saveHelp && <p className="mt-1 text-xs text-red-500">{saveHelp}</p>}
          </div>
        )}
      </div>
    </div>
  );
}



function TextField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm outline-none transition focus:border-brand-green"
        />
      </div>
    </label>
  );
}

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
