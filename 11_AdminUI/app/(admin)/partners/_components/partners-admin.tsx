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
  Image as ImageIcon,
  Trash2,
  TrendingUp,
  Upload,
  Save,
  Utensils,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  generatePartnerPresentationPdf,
  getPartnerSettings,
  updatePartnerSettings,
} from "@/lib/partners/actions";
import {
  getBrandMedia,
  removeBrandMediaAsset,
  saveBrandMediaAsset,
  uploadBrandMediaFile,
} from "@/lib/brand-media/actions";
import type { PartnerSettings } from "@/lib/partners/schema";
import {
  BRAND_MEDIA_CATEGORIES,
  BRAND_MEDIA_PARTNER_TYPES,
  BRAND_MEDIA_USAGES,
  type BrandMediaAsset,
} from "@/lib/brand-media/schema";
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
  | "brandVideoUrl"
  | "brandVideoTitle"
  | "brandVideoBody"
  | "brandOverviewTitle"
  | "brandOverviewBody"
  | "portalBenefitsTitle"
  | "portalBenefitsEyebrow"
  | "portalCommercialTitle"
  | "portalCommercialEyebrow"
  | "portalLocationsTitle"
  | "portalLocationsEyebrow"
  | "brandHostEyebrow"
  | "brandHostTitle"
  | "brandHostBody"
  | "brandHostUsageLabel"
  | "brandHostUsageValue"
  | "brandHostContextLabel"
  | "brandHostContextValue"
  | "brandOwnerEyebrow"
  | "brandOwnerBody"
  | "contactEmail"
  | "contactPhone"
  | "bookingUrl"
  | "assessmentUrl";

const slideOptions = [
  ["cover", "Cover"],
  ["brand", "Brand Promise"],
  ["format", "Kiosk Format"],
  ["benefits", "Benefits"],
  ["rollout", "Rollout Map"],
  ["cta", "CTA / Download"],
] as const;

function newBrandMediaAsset(): BrandMediaAsset {
  const timestamp = new Date().toISOString();
  return {
    id: "",
    title: "",
    description: "",
    url: "",
    thumbnailUrl: "",
    alt: "",
    category: "partner_presentation",
    usage: "slide_visual",
    partnerType: "",
    slideId: "cover",
    isActive: true,
    sortOrder: 100,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

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
  const [deckMessage, setDeckMessage] = useState<string | null>(null);
  const [mediaAssets, setMediaAssets] = useState<BrandMediaAsset[]>([]);
  const [editingAsset, setEditingAsset] = useState<BrandMediaAsset>(() => newBrandMediaAsset());
  const [mediaPending, startMediaTransition] = useTransition();
  const [mediaError, setMediaError] = useState<string | null>(null);
  const saveHelp = saveError ? getPartnerSaveHelp(saveError) : null;

  useEffect(() => {
    getPartnerSettings().then(setSettings);
    getBrandMedia().then((state) => setMediaAssets(state.assets));
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

  function updatePortalSlide(index: number, key: "eyebrow" | "title" | "body" | "visual", value: string) {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        portalSlides: prev.portalSlides.map((slide, slideIndex) =>
          slideIndex === index ? { ...slide, [key]: value } : slide,
        ),
      };
    });
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
        if (result.data) setSettings(result.data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  function handleGenerateDeck() {
    setSaveError(null);
    setDeckMessage(null);
    startTransition(async () => {
      const result = await generatePartnerPresentationPdf();
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      if (result.data) setSettings(result.data);
      setDeckMessage("Partner deck generated and linked for portal download.");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  function updateAsset<K extends keyof BrandMediaAsset>(key: K, value: BrandMediaAsset[K]) {
    setEditingAsset((prev) => ({ ...prev, [key]: value }));
  }

  function handleAssetFile(file: File | null) {
    if (!file) return;
    setMediaError(null);
    startMediaTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("file", file);
        const url = await uploadBrandMediaFile(fd);
        setEditingAsset((prev) => ({
          ...prev,
          url,
          thumbnailUrl: prev.thumbnailUrl || url,
          title: prev.title || file.name.replace(/\.[^.]+$/, ""),
          alt: prev.alt || file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        }));
      } catch (err) {
        setMediaError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  function saveAsset() {
    setMediaError(null);
    startMediaTransition(async () => {
      const result = await saveBrandMediaAsset(editingAsset);
      if (result.error) {
        setMediaError(result.error);
        return;
      }

      const state = await getBrandMedia();
      setMediaAssets(state.assets);
      setEditingAsset(newBrandMediaAsset());
    });
  }

  function deleteAsset(id: string) {
    if (!confirm("Remove this brand media asset?")) return;
    setMediaError(null);
    startMediaTransition(async () => {
      const result = await removeBrandMediaAsset(id);
      if (result.error) {
        setMediaError(result.error);
        return;
      }

      const state = await getBrandMedia();
      setMediaAssets(state.assets);
    });
  }

  const readinessItems = [
    {
      label: "Cover kiosk hero uploaded",
      done: mediaAssets.some((asset) => asset.isActive && asset.slideId === "cover"),
    },
    {
      label: "Kiosk dimensions infographic uploaded",
      done: mediaAssets.some((asset) => asset.isActive && asset.slideId === "format" && asset.category === "infographic"),
    },
    {
      label: "Partner-type kiosk mockups uploaded",
      done: BRAND_MEDIA_PARTNER_TYPES.every((type) =>
        mediaAssets.some((asset) => asset.isActive && asset.partnerType === type),
      ),
    },
    {
      label: "Alexandria rollout map uploaded",
      done: mediaAssets.some((asset) => asset.isActive && asset.slideId === "rollout"),
    },
    {
      label: "Packaging proof photos uploaded",
      done: mediaAssets.some((asset) => asset.isActive && asset.category === "packaging"),
    },
    {
      label: "Staff/customer operation photos uploaded",
      done: mediaAssets.some((asset) => asset.isActive && asset.category === "operations"),
    },
    {
      label: "Downloadable PDF linked",
      done: Boolean(settings.presentationFileUrl || mediaAssets.some((asset) => asset.isActive && asset.usage === "deck_download")),
    },
    {
      label: "CTA email configured",
      done: Boolean(settings.contactEmail),
    },
    {
      label: "Featured locations selected",
      done: settings.featuredLocationIds.length > 0,
    },
    {
      label: "Map pins configured",
      done: branches.some((branch) => typeof branch.lat === "number" && typeof branch.lng === "number"),
    },
  ];

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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="text-xs uppercase tracking-wider font-medium text-muted">Presentation Download</h4>
              <p className="text-[11px] text-muted mt-1">
                Controls the title, version label, and downloadable deck shown in the partner portal.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateDeck}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-yellow px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-ink transition hover:bg-yellow-300 disabled:opacity-50"
            >
              <FileText className="size-4" />
              {isPending ? "Generating..." : "Generate PDF"}
            </button>
          </div>
          {deckMessage && (
            <div className="rounded-lg border border-brand-green/20 bg-brand-green/5 px-4 py-3 text-sm font-medium text-brand-green-deep">
              {deckMessage}
            </div>
          )}
          {settings.presentationFileUrl && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm">
              <span className="min-w-0 truncate text-muted">{settings.presentationFileUrl}</span>
              <a
                href="/partner-portal/deck"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-brand-green hover:underline"
              >
                Open deck <ExternalLink className="size-3" />
              </a>
            </div>
          )}
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

        {/* Portal content */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-5">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-medium text-muted">Portal Content &amp; Brand Video</h4>
            <p className="text-[11px] text-muted mt-1">
              Edit partner-facing headlines, body copy, slide labels, and the YouTube brand video without code changes.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              icon={LinkIcon}
              label="Brand video YouTube URL"
              value={settings.brandVideoUrl}
              onChange={(value) => updateText("brandVideoUrl", value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="md:col-span-2"
            />
            <TextField
              icon={Presentation}
              label="Brand video title"
              value={settings.brandVideoTitle}
              onChange={(value) => updateText("brandVideoTitle", value)}
              placeholder="Brand Video"
            />
            <TextAreaField
              label="Brand video body"
              value={settings.brandVideoBody}
              onChange={(value) => updateText("brandVideoBody", value)}
              placeholder="Short partner-facing video description"
            />
            <TextField
              icon={BookOpen}
              label="Fallback brand overview title"
              value={settings.brandOverviewTitle}
              onChange={(value) => updateText("brandOverviewTitle", value)}
              placeholder="Fast-food Mahshi & oriental home-food"
            />
            <TextAreaField
              label="Fallback brand overview body"
              value={settings.brandOverviewBody}
              onChange={(value) => updateText("brandOverviewBody", value)}
              placeholder="Brand overview copy shown when no video URL is set"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              icon={TrendingUp}
              label="Benefits eyebrow"
              value={settings.portalBenefitsEyebrow}
              onChange={(value) => updateText("portalBenefitsEyebrow", value)}
            />
            <TextField
              icon={TrendingUp}
              label="Benefits headline"
              value={settings.portalBenefitsTitle}
              onChange={(value) => updateText("portalBenefitsTitle", value)}
            />
            <TextField
              icon={Presentation}
              label="Commercial eyebrow"
              value={settings.portalCommercialEyebrow}
              onChange={(value) => updateText("portalCommercialEyebrow", value)}
            />
            <TextField
              icon={Presentation}
              label="Commercial headline"
              value={settings.portalCommercialTitle}
              onChange={(value) => updateText("portalCommercialTitle", value)}
            />
            <TextField
              icon={MapPin}
              label="Locations eyebrow"
              value={settings.portalLocationsEyebrow}
              onChange={(value) => updateText("portalLocationsEyebrow", value)}
            />
            <TextField
              icon={MapPin}
              label="Locations headline"
              value={settings.portalLocationsTitle}
              onChange={(value) => updateText("portalLocationsTitle", value)}
            />
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <h5 className="text-[11px] font-medium uppercase tracking-wider text-muted">
              Brand Host &amp; Owner
            </h5>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextField
                icon={BookOpen}
                label="Host eyebrow"
                value={settings.brandHostEyebrow}
                onChange={(value) => updateText("brandHostEyebrow", value)}
              />
              <TextField
                icon={BookOpen}
                label="Host headline"
                value={settings.brandHostTitle}
                onChange={(value) => updateText("brandHostTitle", value)}
              />
              <TextAreaField
                label="Host body"
                value={settings.brandHostBody}
                onChange={(value) => updateText("brandHostBody", value)}
                className="md:col-span-2"
              />
              <TextField
                icon={FileText}
                label="Usage label"
                value={settings.brandHostUsageLabel}
                onChange={(value) => updateText("brandHostUsageLabel", value)}
              />
              <TextField
                icon={FileText}
                label="Usage value"
                value={settings.brandHostUsageValue}
                onChange={(value) => updateText("brandHostUsageValue", value)}
              />
              <TextField
                icon={FileText}
                label="Context label"
                value={settings.brandHostContextLabel}
                onChange={(value) => updateText("brandHostContextLabel", value)}
              />
              <TextField
                icon={FileText}
                label="Context value"
                value={settings.brandHostContextValue}
                onChange={(value) => updateText("brandHostContextValue", value)}
              />
              <TextField
                icon={Presentation}
                label="Owner eyebrow"
                value={settings.brandOwnerEyebrow}
                onChange={(value) => updateText("brandOwnerEyebrow", value)}
              />
              <TextAreaField
                label="Owner body"
                value={settings.brandOwnerBody}
                onChange={(value) => updateText("brandOwnerBody", value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-[11px] font-medium uppercase tracking-wider text-muted">
              Presentation Slides
            </h5>
            {settings.portalSlides.map((slide, index) => (
              <div key={slide.id} className="rounded-xl border border-border bg-background p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField
                    icon={Presentation}
                    label={`Slide ${index + 1} eyebrow`}
                    value={slide.eyebrow}
                    onChange={(value) => updatePortalSlide(index, "eyebrow", value)}
                  />
                  <TextField
                    icon={FileText}
                    label="Slide headline"
                    value={slide.title}
                    onChange={(value) => updatePortalSlide(index, "title", value)}
                  />
                  <TextAreaField
                    label="Slide body"
                    value={slide.body}
                    onChange={(value) => updatePortalSlide(index, "body", value)}
                  />
                  <TextAreaField
                    label="Visual direction"
                    value={slide.visual}
                    onChange={(value) => updatePortalSlide(index, "visual", value)}
                  />
                </div>
              </div>
            ))}
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

        {/* Presentation media */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-xs uppercase tracking-wider font-medium text-muted">Presentation Media</h4>
              <p className="text-[11px] text-muted mt-1">
                Upload generated or approved brand media and assign it to slides without code changes.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-yellow px-3 py-2 text-xs font-semibold text-brand-ink transition hover:bg-yellow-300">
              <Upload className="size-4" />
              Upload image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => handleAssetFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {mediaError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {mediaError}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-3 rounded-xl border border-border bg-background p-4">
              <div className="overflow-hidden rounded-lg bg-surface-muted">
                {editingAsset.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editingAsset.url} alt={editingAsset.alt || ""} className="h-44 w-full object-cover" />
                ) : (
                  <div className="flex h-44 items-center justify-center text-muted">
                    <ImageIcon className="size-8" />
                  </div>
                )}
              </div>
              <TextField
                icon={Presentation}
                label="Title"
                value={editingAsset.title}
                onChange={(value) => updateAsset("title", value)}
                placeholder="Main hero kiosk in mall corridor"
              />
              <TextField
                icon={BookOpen}
                label="Alt text"
                value={editingAsset.alt}
                onChange={(value) => updateAsset("alt", value)}
                placeholder="MaMa Zainab kiosk in modern mall corridor"
              />
              <TextField
                icon={LinkIcon}
                label="Asset URL"
                value={editingAsset.url}
                onChange={(value) => updateAsset("url", value)}
                placeholder="/uploads/brand-media/..."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField
                  label="Category"
                  value={editingAsset.category}
                  options={BRAND_MEDIA_CATEGORIES}
                  onChange={(value) => updateAsset("category", value as BrandMediaAsset["category"])}
                />
                <SelectField
                  label="Usage"
                  value={editingAsset.usage}
                  options={BRAND_MEDIA_USAGES}
                  onChange={(value) => updateAsset("usage", value as BrandMediaAsset["usage"])}
                />
                <SelectField
                  label="Partner Type"
                  value={editingAsset.partnerType || ""}
                  options={["", ...BRAND_MEDIA_PARTNER_TYPES]}
                  onChange={(value) => updateAsset("partnerType", value as BrandMediaAsset["partnerType"])}
                />
                <SelectField
                  label="Slide"
                  value={editingAsset.slideId}
                  options={slideOptions.map(([id]) => id)}
                  labels={Object.fromEntries(slideOptions)}
                  onChange={(value) => updateAsset("slideId", value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  icon={FileText}
                  label="Sort order"
                  value={String(editingAsset.sortOrder)}
                  onChange={(value) => updateAsset("sortOrder", Number(value) || 0)}
                />
                <label className="flex items-end gap-2 pb-2 text-xs font-medium text-muted">
                  <input
                    type="checkbox"
                    checked={editingAsset.isActive}
                    onChange={(event) => updateAsset("isActive", event.target.checked)}
                    className="accent-brand-green"
                  />
                  Active
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveAsset}
                  disabled={mediaPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-green-deep disabled:opacity-50"
                >
                  <Save className="size-4" />
                  {mediaPending ? "Saving..." : "Save Asset"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAsset(newBrandMediaAsset())}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
                >
                  New
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {mediaAssets.map((asset) => (
                <div key={asset.id} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.thumbnailUrl || asset.url} alt={asset.alt} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="truncate text-sm font-semibold">{asset.title}</p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {asset.category} / {asset.usage}
                          {asset.slideId ? ` / ${asset.slideId}` : ""}
                          {asset.partnerType ? ` / ${asset.partnerType}` : ""}
                        </p>
                      </div>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", asset.isActive ? "bg-brand-green/10 text-brand-green" : "bg-gray-100 text-muted")}>
                        {asset.isActive ? "Active" : "Off"}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingAsset(asset)}
                        className="text-xs font-semibold text-brand-green hover:underline"
                      >
                        Edit
                      </button>
                      {!asset.id.startsWith("asset_partner_") && (
                        <button
                          type="button"
                          onClick={() => deleteAsset(asset.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red hover:underline"
                        >
                          <Trash2 className="size-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Readiness checklist */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-medium text-muted">Presentation Media Readiness</h4>
            <p className="text-[11px] text-muted mt-1">
              Use this checklist before sharing the portal with property owners.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {readinessItems.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                  item.done ? "border-brand-green/20 bg-brand-green/5 text-brand-ink" : "border-border bg-background text-muted",
                )}
              >
                <span className={cn("size-2.5 rounded-full", item.done ? "bg-brand-green" : "bg-gray-300")} />
                {item.label}
              </div>
            ))}
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

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
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
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 outline-none transition focus:border-brand-green"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  labels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-brand-green"
      >
        {options.map((option) => (
          <option key={option || "none"} value={option}>
            {labels?.[option] ?? (option ? option.replace(/_/g, " ") : "Any")}
          </option>
        ))}
      </select>
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
