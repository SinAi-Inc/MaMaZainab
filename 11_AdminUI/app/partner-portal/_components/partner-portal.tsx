"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Download,
  Handshake,
  Lock,
  MessageCircle,
  Presentation,
  TrendingUp,
  Utensils,
  Users,
} from "lucide-react";
import { authenticatePartnerPortal } from "@/lib/partners/actions";
import type { BrandMediaAsset } from "@/lib/brand-media/schema";

type PartnerLocation = {
  id: string;
  name?: string;
  title?: string;
  area?: string;
  city?: string;
  type?: string;
  status?: string;
  address?: string;
  lat?: number;
  lng?: number;
  partnerType?: string;
  priority?: "confirmed" | "target" | "prospect";
  footfallEstimate?: string;
  recommendedFormat?: string;
  commercialModel?: string;
};

type PartnerPortalProps = {
  authenticated: boolean;
  portalEnabled: boolean;
  showPresentation: boolean;
  showLocations: boolean;
  showBrandOverview: boolean;
  showMenu: boolean;
  locations: PartnerLocation[];
  presentationTitle?: string;
  presentationSubtitle?: string;
  presentationFileUrl?: string;
  presentationVersion?: string;
  presentationUpdatedAt?: string;
  contactEmail?: string;
  contactPhone?: string;
  bookingUrl?: string;
  assessmentUrl?: string;
  mediaAssets?: BrandMediaAsset[];
};

const partnerTypes = [
  "Malls",
  "Clubs",
  "Hypermarkets",
  "Cinemas",
  "Universities",
  "Petrol Stations",
  "Compounds",
];

const slides = [
  {
    id: "cover",
    eyebrow: "Partner Opportunity",
    title: "Bring MaMa Zainab to Your Location",
    body:
      "A compact, high-visibility Egyptian comfort-food kiosk built for premium footfall destinations.",
    visual: "Kiosk hero + Alexandria rollout map",
  },
  {
    id: "brand",
    eyebrow: "Brand Promise",
    title: "The Village Way, or Not at All",
    body:
      "Authentic Mahshi and oriental home-food, served with homemade warmth and fast-food speed.",
    visual: "Logo, palette, MaMa Zainab character, pattern system",
  },
  {
    id: "format",
    eyebrow: "Kiosk Format",
    title: "Small Footprint. Big Brand Presence.",
    body:
      "A modular kiosk format designed for food courts, entrances, club zones, cinema lobbies, and retail corridors.",
    visual: "3m x 2m x 2.5m kiosk diagram",
  },
  {
    id: "benefits",
    eyebrow: "Location Owner Benefits",
    title: "A Ready-Made Food Attraction",
    body:
      "Adds a strong local food category, activates unused space, increases dwell time, and creates a photo-friendly tenant.",
    visual: "Partner benefit cards",
  },
  {
    id: "rollout",
    eyebrow: "Expansion Plan",
    title: "Alexandria First. Egypt Next.",
    body:
      "The rollout starts with dense Alexandria coverage, then expands into clubs, malls, campuses, hypermarkets, and compounds.",
    visual: "Interactive location map",
  },
  {
    id: "cta",
    eyebrow: "Next Step",
    title: "Partner Deck Ready for Review",
    body:
      "Download the live partner PDF, then request a tasting session or submit your location for assessment.",
    visual: "Live partner deck and next actions",
  },
];

const partnerFitCopy: Record<string, string> = {
  Malls:
    "A high-visibility food court or corridor kiosk that adds local flavor, strong visual identity, and repeat comfort-food demand.",
  Clubs:
    "A family-friendly comfort-food stop for members, kids, and weekend gatherings.",
  Hypermarkets:
    "A ready-to-eat and takeaway food concept that complements grocery missions and exit-path cravings.",
  Cinemas:
    "A compact local-food counter for lobby dwell time, pre-show meals, and after-movie takeaway.",
  Universities:
    "A fast, affordable, nostalgic meal stop for students, faculty, and campus events.",
  "Petrol Stations":
    "A road-stop comfort-food kiosk for quick meals, family bundles, and premium takeaway.",
  Compounds:
    "A neighborhood food amenity for residents, families, gatherings, and delivery within the community.",
};

const partnerBenefits = [
  "Activates unused space",
  "Adds local comfort-food category",
  "Increases dwell time",
  "Photo-friendly visual identity",
  "Family-friendly food concept",
  "Supports tasting campaigns",
  "Works as pilot or permanent tenant",
  "Flexible commercial model",
];

const commercialModels = [
  "Fixed Rent",
  "Revenue Share",
  "Minimum Guarantee + Revenue Share",
  "Seasonal Activation",
  "90-Day Pilot Kiosk",
];

const partnerPortalIdentityAssets = {
  mamaZainab: {
    src: "/partner-portal/assets/mama-zainab-final",
    alt: "MaMa Zainab holding a platter of mahshi with ZuZu",
  },
  shengStamp: {
    src: "/partner-portal/assets/sheng-stamp",
    alt: "Sheng Heng Wang founder and brand owner stamp",
  },
  shengFounder: {
    src: "/partner-portal/assets/sheng-founder-photo",
    alt: "Sheng Heng Wang brand owner portrait",
  },
};

function buildWhatsAppHref(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

const partnerTypeToMediaKey: Record<string, string> = {
  Malls: "mall",
  Clubs: "club",
  Hypermarkets: "hypermarket",
  Cinemas: "cinema",
  Universities: "university",
  "Petrol Stations": "petrol_station",
  Compounds: "compound",
};

function getSlideVisualAsset({
  slideId,
  partnerType,
  assets,
}: {
  slideId: string;
  partnerType: string;
  assets: BrandMediaAsset[];
}) {
  const mediaPartnerType = partnerTypeToMediaKey[partnerType] ?? "";
  const activeAssets = assets
    .filter((asset) => asset.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    activeAssets.find(
      (asset) =>
        asset.slideId === slideId &&
        Boolean(mediaPartnerType) &&
        asset.partnerType === mediaPartnerType,
    ) ||
    activeAssets.find((asset) => asset.slideId === slideId) ||
    activeAssets.find((asset) => asset.usage === "slide_visual") ||
    activeAssets.find((asset) => asset.usage === "partner_cover")
  );
}

export function PartnerPortal({
  authenticated,
  portalEnabled,
  showPresentation,
  showLocations,
  showBrandOverview,
  showMenu,
  locations,
  presentationTitle = "MaMa Zainab Partner Presentation",
  presentationSubtitle = "Authentic Mahshi. Homemade Taste. Fast-Food Speed.",
  presentationFileUrl = "",
  presentationVersion = "v0.1",
  presentationUpdatedAt = "",
  contactPhone = "",
  bookingUrl = "",
  assessmentUrl = "",
  mediaAssets = [],
}: PartnerPortalProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [partnerType, setPartnerType] = useState("Malls");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const slide = slides[activeSlide];
  const featuredLocations = useMemo(() => locations.slice(0, 6), [locations]);
  const phoneHref = contactPhone ? `tel:${contactPhone.replace(/[^\d+]/g, "")}` : "";
  const contactHref =
    buildWhatsAppHref(contactPhone, "Hello MaMa Zainab, I would like to discuss a partnership.") ||
    phoneHref ||
    "#";
  const selectedFit = partnerFitCopy[partnerType] ?? partnerFitCopy.Malls;
  const assessmentHref =
    assessmentUrl ||
    buildWhatsAppHref(contactPhone, "Hello MaMa Zainab, I would like to request a location assessment.") ||
    phoneHref ||
    "#";
  const bookingHref =
    bookingUrl ||
    buildWhatsAppHref(contactPhone, "Hello MaMa Zainab, I would like to book a tasting session.") ||
    phoneHref ||
    "#";
  const deckReady = showPresentation && Boolean(presentationFileUrl);
  const deckHref = deckReady ? "/partner-portal/deck" : "";
  const activeMediaCount = mediaAssets.filter((asset) => asset.isActive).length;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const ok = await authenticatePartnerPortal(passcode);
      if (ok) {
        setPasscode("");
        router.refresh();
        return;
      }

      setPasscode("");
      setError("Invalid passcode. Please contact your MaMa Zainab representative.");
    });
  }

  if (!portalEnabled) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-green px-5 py-16 text-white">
        <div className="absolute inset-0 plaid opacity-80" />
        <section className="relative z-10 w-full max-w-md rounded-2xl bg-brand-ink/85 px-8 py-12 text-center shadow-2xl backdrop-blur-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mark.png" alt="" className="mx-auto mb-4 size-12" draggable={false} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-yellow">
            MaMa Zainab
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-brand)] text-3xl tracking-[0.14em]">
            Partner Portal Coming Soon
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Partner access is currently disabled from admin settings.
          </p>
          <BackLink />
        </section>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-green px-5 py-16 text-white">
        <div className="absolute inset-0 plaid opacity-80" />
        <section className="relative z-10 w-full max-w-md rounded-2xl bg-brand-ink/85 px-8 py-12 text-center shadow-2xl backdrop-blur-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-wordmark-transparent.png" alt="MaMa Zainab" className="mx-auto w-full max-w-xs" draggable={false} />
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-yellow">
            Private Partner Access
          </p>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Exclusive access for malls, landmarks, retail locations, clubs, and strategic property partners.
            Authentication is required to view the full presentation.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-3">
            <label className="relative block">
              <span className="sr-only">Partner passcode</span>
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                placeholder="Passcode"
                required
                autoFocus
                className="w-full rounded-lg border border-white/20 bg-white/10 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-brand-yellow focus:bg-white/15"
              />
            </label>
            {error && <p className="text-xs font-medium text-brand-red">{error}</p>}
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center rounded-lg bg-brand-yellow px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-ink transition hover:bg-yellow-300 disabled:opacity-50"
            >
              {isPending ? "Verifying" : "Enter Portal"}
            </button>
          </form>
          <BackLink />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-cream text-brand-ink">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-ink/95 px-6 py-3 text-white backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/coming-soon" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/mark.png" alt="" className="size-8" draggable={false} />
            <span className="font-[family-name:var(--font-brand)] text-xs tracking-[0.18em]">
              MaMa Zainab
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {showPresentation && (
              <DeckComingSoonButton
                label={deckReady ? "Download Deck" : "Deck"}
                href={deckHref || undefined}
                className="hidden bg-brand-yellow px-4 py-2 text-brand-ink hover:bg-yellow-300 sm:inline-flex"
              />
            )}
            <a
              href={contactHref}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 transition hover:border-brand-yellow hover:text-brand-yellow"
            >
              <MessageCircle className="size-3.5" />
              Contact
            </a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-brand-green text-white">
        <div className="absolute inset-0 plaid opacity-35" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
          <div className="flex min-h-[420px] flex-col justify-between rounded-2xl bg-brand-ink/80 p-7 shadow-2xl backdrop-blur-sm md:p-9">
            <div>
              <p className="mb-5 inline-flex rounded-lg bg-brand-yellow px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-ink">
                {presentationVersion || "Partner Presentation"}
              </p>
              <h1 className="max-w-3xl font-[family-name:var(--font-brand)] text-2xl leading-none tracking-[0.08em] md:text-4xl">
                {presentationTitle}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 md:text-lg">
                {presentationSubtitle}
              </p>
              {presentationUpdatedAt && (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Updated {presentationUpdatedAt}
                </p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {partnerTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPartnerType(type)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    partnerType === type
                      ? "bg-brand-yellow text-brand-ink"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-white/15 bg-white p-5 text-brand-ink shadow-2xl">
            <div className="relative flex aspect-[16/10] overflow-hidden rounded-xl bg-brand-ink p-6">
              <div className="absolute inset-0 plaid opacity-25" />
              <div className="relative m-auto w-full max-w-sm rounded-xl bg-white/95 p-6 text-center shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo-primary.png" alt="MaMa Zainab" className="mx-auto mb-4 w-44" draggable={false} />
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">
                  Live Deck Preview
                </p>
                <h2 className="mt-3 text-2xl font-semibold">{partnerType} Model</h2>
                <p className="mt-2 text-sm leading-6 text-muted-fg">
                  {selectedFit}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Metric label="Kiosk" value="3x2m" />
              <Metric label="Height" value="2.5m" />
              <Metric label="City" value="Alex" />
            </div>
          </aside>
        </div>
      </section>

      <PartnerIdentityBand />

      {showPresentation && (
        <section className="mx-auto grid max-w-7xl gap-6 px-6 py-10 lg:grid-cols-[280px_1fr]">
          <nav className="rounded-2xl border border-border-default bg-white p-4 shadow-sm">
            <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">
              Presentation
            </p>
            <div className="space-y-2">
              {slides.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={`w-full rounded-lg p-4 text-left transition ${
                    activeSlide === index
                      ? "bg-brand-green text-white"
                      : "bg-surface-muted text-brand-ink hover:bg-brand-yellow/30"
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">
                    {String(index + 1).padStart(2, "0")} / {item.eyebrow}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-tight">{item.title}</p>
                </button>
              ))}
            </div>
          </nav>

          <article className="overflow-hidden rounded-2xl border border-border-default bg-white shadow-xl">
            <div className="grid min-h-[520px] lg:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col justify-between p-7 md:p-10">
                <div>
                  <p className="mb-4 inline-flex rounded-lg bg-brand-yellow px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-ink">
                    {slide.eyebrow}
                  </p>
                  <h2
                    className="font-[family-name:var(--font-brand)] text-2xl leading-none tracking-[0.08em] md:text-3xl"
                  >
                    {slide.title}
                  </h2>
                  <p className="mt-6 max-w-2xl text-base leading-7 text-muted-fg md:text-lg">
                    {slide.body}
                  </p>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-3">
                  <InfoCard title="Partner Type" value={partnerType} />
                  <InfoCard title="Format" value="Kiosk / Corner" />
                  <InfoCard title="Action" value={deckReady ? "Deck ready" : "Deck coming soon"} />
                </div>
              </div>

              <div className="relative overflow-hidden bg-brand-green p-7">
                <div className="absolute inset-0 plaid opacity-20" />
                <div className="relative flex h-full min-h-[360px] flex-col justify-between rounded-xl bg-brand-cream p-7 shadow-2xl">
                  <SlideVisual
                    slideId={slide.id}
                    visual={slide.visual}
                    partnerType={partnerType}
                    deckUrl={deckHref}
                    deckVersion={presentationVersion}
                    deckUpdatedAt={presentationUpdatedAt}
                    activeMediaCount={activeMediaCount}
                    locationsCount={locations.length}
                    locations={locations}
                    asset={getSlideVisualAsset({
                      slideId: slide.id,
                      partnerType,
                      assets: mediaAssets,
                    })}
                    relatedAssets={mediaAssets.filter(
                      (asset) => asset.isActive && asset.slideId === slide.id,
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border-default bg-surface-muted px-5 py-4 md:px-8">
              <button
                type="button"
                onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                className="rounded-lg border border-brand-green px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-green disabled:opacity-40"
                disabled={activeSlide === 0}
              >
                Previous
              </button>
              <p className="text-xs font-semibold text-muted-fg">
                Slide {activeSlide + 1} of {slides.length}
              </p>
              <button
                type="button"
                onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
                className="rounded-lg bg-brand-green px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-40"
                disabled={activeSlide === slides.length - 1}
              >
                Next
              </button>
            </div>
          </article>
        </section>
      )}

      <section className="mx-auto max-w-7xl space-y-5 px-6 pb-12">
        <div className="grid gap-5 lg:grid-cols-3">
          {showBrandOverview && (
            <PortalCard
              icon={<Presentation className="size-5" />}
              eyebrow="Brand Overview"
              title="Fast-food Mahshi & oriental home-food"
              body="MaMa Zainab is village authenticity at scale: warm, nostalgic, premium-casual Egyptian comfort food founded in Alexandria."
            />
          )}
          {showMenu && (
            <PortalCard
              icon={<Utensils className="size-5" />}
              eyebrow="Menu System"
              title="Focused comfort-food category"
              body="Stuffed grape leaves, stuffed vegetables, mombar, macaroni bechamel, sauces, drinks, and bundles."
              actionHref="/menu/preview?peek=1"
              actionLabel="View Menu"
            />
          )}
          {showPresentation && (
            <PortalCard
              icon={<Download className="size-5" />}
              eyebrow="Download"
              title="Partner Presentation"
              body={
                deckReady
                  ? "Download the current partner PDF/PPTX package for client review, meetings, and location conversations."
                  : "The final partner deck is not published yet. Request a tasting, meeting, or location assessment while the PDF is prepared."
              }
              comingSoonAction={!deckReady}
              actionHref={deckHref || undefined}
              actionLabel={deckReady ? "Download Deck" : "Deck Unavailable"}
            />
          )}
        </div>

        {showBrandOverview && (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-border-default bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-brand-green/10 p-3 text-brand-green">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-green">
                    Property Partner Benefits
                  </p>
                  <h2 className="text-xl font-semibold">Why the kiosk earns its space</h2>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {partnerBenefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3 rounded-lg bg-surface-muted p-3">
                    <CheckCircle2 className="size-4 shrink-0 text-brand-green" />
                    <span className="text-sm font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border-default bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-brand-yellow/50 p-3 text-brand-ink">
                  <Handshake className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-green">
                    Commercial Models
                  </p>
                  <h2 className="text-xl font-semibold">Flexible model paths</h2>
                </div>
              </div>
              <div className="space-y-2">
                {commercialModels.map((model) => (
                  <div key={model} className="rounded-lg border border-border-default px-4 py-3 text-sm font-semibold">
                    {model}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>

      {showLocations && (
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">
                  Featured Locations
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-brand)] text-4xl tracking-[0.08em]">
                  Partner-ready rollout points
                </h2>
              </div>
              <p className="text-sm font-semibold text-muted-fg">
                {locations.length} location{locations.length === 1 ? "" : "s"} available
              </p>
            </div>

            {featuredLocations.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {featuredLocations.map((location) => (
                  <div
                    key={location.id}
                    className="rounded-lg border border-border-default bg-surface-muted p-5"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-green">
                      {location.type || "Location"}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">
                      {location.name || location.title || "Unnamed Location"}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-muted-fg">
                      {[location.area, location.city].filter(Boolean).join(", ") ||
                        location.address ||
                        "Alexandria"}
                    </p>
                    {location.status && (
                      <p className="mt-4 inline-flex rounded-lg bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-green">
                        {location.status}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-surface-muted p-6 text-sm font-medium text-muted-fg">
                No featured locations are configured yet.
              </div>
            )}
          </div>
        </section>
      )}

      <PartnerPortalFooter
        assessmentHref={assessmentHref}
        bookingHref={bookingHref}
        contactHref={contactHref}
        phoneHref={phoneHref}
      />
    </main>
  );
}

function PartnerIdentityBand() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="grid overflow-hidden rounded-2xl border border-border-default bg-white shadow-sm lg:grid-cols-[0.85fr_1fr_0.85fr]">
        <div className="relative min-h-[310px] overflow-hidden bg-brand-green text-white">
          <div className="absolute inset-0 plaid opacity-25" />
          <div className="absolute inset-x-6 bottom-6 top-6 rounded-2xl border border-white/20 bg-white/10" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={partnerPortalIdentityAssets.mamaZainab.src}
            alt={partnerPortalIdentityAssets.mamaZainab.alt}
            className="absolute bottom-0 left-1/2 h-[300px] max-w-none -translate-x-1/2 object-contain sm:h-[340px] lg:h-[360px]"
            draggable={false}
          />
        </div>

        <div className="flex flex-col justify-center p-6 md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">
            Brand Host
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-tight">
            MaMa Zainab anchors every partner conversation
          </h2>
          <p className="mt-4 text-sm font-medium leading-6 text-muted-fg">
            The portal now carries the core character visual beside the partnership story, connecting
            location proposals, tasting meetings, and kiosk rollout material to the recognizable brand host.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-surface-muted p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-green">
                Usage
              </p>
              <p className="mt-2 text-sm font-semibold">Partner introductions</p>
            </div>
            <div className="rounded-lg bg-surface-muted p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-green">
                Context
              </p>
              <p className="mt-2 text-sm font-semibold">Brand origin and trust</p>
            </div>
          </div>
        </div>

        <aside className="border-t border-border-default bg-brand-cream/70 p-6 md:p-8 lg:border-l lg:border-t-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">
            Brand Owner
          </p>
          <div className="mt-5 overflow-hidden rounded-xl border border-border-default bg-white shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={partnerPortalIdentityAssets.shengFounder.src}
              alt={partnerPortalIdentityAssets.shengFounder.alt}
              className="h-56 w-full object-cover object-top"
              draggable={false}
            />
          </div>
          <p className="mt-5 text-sm font-medium leading-6 text-muted-fg">
            Sheng Heng Wang is the founder and brand owner behind the MaMa Zainab partner rollout.
            The founder seal now appears in the footer where authorization and next-step actions belong.
          </p>
        </aside>
      </div>
    </section>
  );
}

function PartnerPortalFooter({
  assessmentHref,
  bookingHref,
  contactHref,
  phoneHref,
}: {
  assessmentHref: string;
  bookingHref: string;
  contactHref: string;
  phoneHref: string;
}) {
  const actions = [
    { href: assessmentHref, label: "Site Fit", emoji: "📍", primary: true },
    { href: bookingHref, label: "Tasting", emoji: "🍽️" },
    { href: contactHref, label: "Partner Chat", emoji: "💬" },
    ...(phoneHref ? [{ href: phoneHref, label: "Call / WhatsApp", emoji: "☎️" }] : []),
  ];

  return (
    <footer className="mx-auto max-w-7xl px-6 pb-10">
      <div className="relative overflow-hidden rounded-2xl bg-brand-ink text-white shadow-xl">
        <div className="absolute inset-0 plaid opacity-10" />
        <div className="relative grid gap-0 lg:grid-cols-[1fr_300px]">
          <div className="p-6 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-yellow">
              Next Step
            </p>
            <div className="mt-3 grid gap-5 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
              <div>
                <h2 className="font-[family-name:var(--font-brand)] text-2xl leading-tight tracking-[0.08em] md:text-3xl">
                  Bring MaMa Zainab to Your Location
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
                  Share the location, book a tasting, or open the commercial conversation with the
                  partnerships team.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {actions.map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition ${
                      action.primary
                        ? "bg-brand-yellow text-brand-ink hover:bg-yellow-300"
                        : "border border-white/20 text-white hover:border-brand-yellow hover:text-brand-yellow"
                    }`}
                  >
                    <span aria-hidden="true" className="text-sm leading-none">
                      {action.emoji}
                    </span>
                    {action.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <aside className="border-t border-white/10 bg-brand-cream p-5 text-brand-ink md:p-6 lg:border-l lg:border-t-0">
            <div className="grid gap-4 sm:grid-cols-[150px_1fr] sm:items-center lg:grid-cols-1">
              <div className="mx-auto flex aspect-square w-36 items-center justify-center rounded-full border border-brand-red/25 bg-white p-3 shadow-inner md:w-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={partnerPortalIdentityAssets.shengStamp.src}
                  alt={partnerPortalIdentityAssets.shengStamp.alt}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">
                  Founder Seal
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-brand-ink">
                  Authorized partner material only.
                </p>
                <p className="mt-1 text-xs font-medium leading-5 text-muted-fg">
                  Do not copy, forward, or use outside this portal. Founder-owned, current,
                  and confidential.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="relative border-t border-white/10 px-6 py-4 text-center text-[10px] uppercase tracking-[0.2em] text-white/45">
          (c) 2026 MaMa Zainab - Confidential - For Authorized Partners Only
        </div>
      </div>
    </footer>
  );
}

function SlideVisual({
  slideId,
  visual,
  partnerType,
  deckUrl,
  deckVersion,
  deckUpdatedAt,
  activeMediaCount,
  locationsCount,
  locations,
  asset,
  relatedAssets,
}: {
  slideId: string;
  visual: string;
  partnerType: string;
  deckUrl: string;
  deckVersion: string;
  deckUpdatedAt: string;
  activeMediaCount: number;
  locationsCount: number;
  locations: PartnerLocation[];
  asset?: BrandMediaAsset;
  relatedAssets: BrandMediaAsset[];
}) {
  const activeRelated = relatedAssets
    .filter((item) => item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const galleryAssets = activeRelated.length > 0 ? activeRelated : asset ? [asset] : [];

  if (slideId === "cover") {
    return (
      <>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">
            Live Partner Deck
          </p>
          <h3 className="mt-3 text-2xl font-semibold leading-tight">
            Presentation visuals are live and partner-ready
          </h3>
          <p className="mt-2 text-sm font-medium leading-6 text-muted-fg">
            Kiosk, brand, rollout, and proof assets now feed the portal deck experience.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset?.url || "/brand/partners/kiosk.png"}
            alt={asset?.alt || "MaMa Zainab kiosk render"}
            className="h-44 w-full object-contain p-3"
            draggable={false}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Deck" value={deckVersion || "Live"} />
          <Metric label="Media" value={String(activeMediaCount)} />
          <Metric label="Sites" value={String(locationsCount)} />
        </div>
      </>
    );
  }

  if (slideId === "brand") {
    return (
      <>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">
            Brand System
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-primary.png" alt="MaMa Zainab" className="mt-5 w-56" draggable={false} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            ["Green", "bg-brand-green"],
            ["Yellow", "bg-brand-yellow"],
            ["Red", "bg-brand-red"],
            ["Ink", "bg-brand-ink"],
          ].map(([label, color]) => (
            <div key={label} className="space-y-2">
              <div className={`h-14 rounded-lg ${color}`} />
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-fg">
                {label}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(galleryAssets.length > 0
            ? galleryAssets.slice(0, 3)
            : [
                { id: "box", url: "/brand/partners/packaging-box.jpeg", alt: "Packaging box" },
                { id: "takeaway", url: "/brand/partners/packaging-takeaway.jpeg", alt: "Takeaway pack" },
                { id: "canholder", url: "/brand/partners/packaging-canholder.jpeg", alt: "Can holder" },
              ]
          ).map((item) => (
            <div key={item.id} className="overflow-hidden rounded-lg bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.alt} className="h-24 w-full object-cover" draggable={false} />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (slideId === "format") {
    return (
      <>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">
            Kiosk Format
          </p>
          <div className="mt-6 rounded-xl border-4 border-brand-green bg-white p-5 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset?.url || "/brand/partners/kiosk.png"}
              alt={asset?.alt || "MaMa Zainab modular kiosk"}
              className="h-40 w-full rounded-lg object-contain"
              draggable={false}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Footprint" value="3x2m" />
          <Metric label="Height" value="2.5m" />
          <Metric label="Format" value="Modular" />
        </div>
      </>
    );
  }

  if (slideId === "benefits") {
    return (
      <>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">
            Partner Benefits
          </p>
          <h3 className="mt-3 text-2xl font-semibold leading-tight">{visual}</h3>
        </div>
        <div className="grid gap-2">
          {partnerBenefits.slice(0, 5).map((benefit) => (
            <div key={benefit} className="flex items-center gap-3 rounded-lg bg-white p-3 text-sm font-semibold">
              <CheckCircle2 className="size-4 shrink-0 text-brand-green" />
              {benefit}
            </div>
          ))}
        </div>
      </>
    );
  }

  if (slideId === "rollout") {
    return (
      <>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">
            Alexandria Rollout
          </p>
          <h3 className="mt-3 text-2xl font-semibold leading-tight">
            {locationsCount > 0 ? `${locationsCount} configured rollout point${locationsCount === 1 ? "" : "s"}` : "Rollout map ready for branch data"}
          </h3>
        </div>
        <RolloutMap locations={locations} asset={asset} />
      </>
    );
  }

  if (slideId === "cta") {
    return (
      <>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">
            Deck Download
          </p>
          <h3 className="mt-3 text-2xl font-semibold leading-tight">
            Partner presentation PDF is live
          </h3>
          <p className="mt-2 text-sm font-medium leading-6 text-muted-fg">
            The download is generated from the current partner portal settings, locations, and media
            assets each time it is requested.
          </p>
        </div>
        <div className="grid gap-2 rounded-xl bg-white p-4 shadow-sm">
          <InfoCard title="Version" value={deckVersion || "Live"} />
          <InfoCard title="Updated" value={deckUpdatedAt || "On request"} />
          <InfoCard title="Output" value="PDF deck" />
        </div>
        <DeckComingSoonButton
          label={deckUrl ? "Download Partner Deck" : "Deck Not Enabled"}
          href={deckUrl || undefined}
          className="w-full bg-brand-green px-4 py-4 text-white hover:bg-brand-green-deep"
        />
      </>
    );
  }

  return (
    <>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-green">
          Location Fit
        </p>
        <h3 className="mt-3 text-2xl font-semibold leading-tight">{visual}</h3>
      </div>
      {asset ? (
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.url} alt={asset.alt} className="h-52 w-full object-cover" draggable={false} />
        </div>
      ) : (
        <div className="rounded-xl bg-white p-5">
          <Users className="mb-4 size-8 text-brand-green" />
          <p className="text-sm font-semibold leading-6 text-brand-ink">
            {partnerFitCopy[partnerType]}
          </p>
        </div>
      )}
    </>
  );
}

const mapFilters = [
  ["all", "All"],
  ["mall", "Malls"],
  ["club", "Clubs"],
  ["hypermarket", "Hypermarkets"],
  ["cinema", "Cinemas"],
  ["university", "Universities"],
  ["petrol_station", "Petrol Stations"],
  ["compound", "Compounds"],
] as const;

function formatLabel(value?: string) {
  return value ? value.replace(/_/g, " ") : "Unset";
}

function RolloutMap({
  locations,
  asset,
}: {
  locations: PartnerLocation[];
  asset?: BrandMediaAsset;
}) {
  const [filter, setFilter] = useState<(typeof mapFilters)[number][0]>("all");
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const filteredLocations =
    filter === "all"
      ? locations
      : locations.filter((location) => location.partnerType === filter);
  const mappedLocations = filteredLocations.filter(
    (location) => typeof location.lat === "number" && typeof location.lng === "number",
  );
  const visiblePins = mappedLocations.length > 0 ? mappedLocations : filteredLocations.slice(0, 4);
  const activeLocation =
    visiblePins.find((location) => location.id === activeLocationId) ?? visiblePins[0];

  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {mapFilters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setFilter(value);
              setActiveLocationId(null);
            }}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
              filter === value
                ? "bg-brand-green text-white"
                : "bg-white text-brand-ink hover:bg-brand-yellow/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative h-48 overflow-hidden rounded-xl bg-white">
        {asset ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.url} alt={asset.alt} className="absolute inset-0 h-full w-full object-cover opacity-80" draggable={false} />
            <div className="absolute inset-0 bg-brand-cream/55" />
          </>
        ) : (
          <div className="absolute inset-0 plaid opacity-20" />
        )}

        {visiblePins.map((location, index) => {
          const left = mappedLocations.length > 0 && location.lng
            ? Math.min(82, Math.max(12, ((location.lng - 29.75) / 0.35) * 70 + 12))
            : [18, 42, 66, 78][index % 4];
          const top = mappedLocations.length > 0 && location.lat
            ? Math.min(78, Math.max(18, (1 - (location.lat - 31.05) / 0.25) * 60 + 18))
            : [35, 54, 30, 64][index % 4];
          const pinClass =
            location.priority === "confirmed"
              ? "bg-brand-green ring-brand-green/25"
              : location.priority === "target"
                ? "bg-brand-yellow ring-brand-yellow/35"
                : "bg-brand-cream ring-brand-green/35 border border-brand-green";

          return (
            <button
              key={location.id}
              type="button"
              title={location.name || location.title || "Location"}
              onClick={() => setActiveLocationId(location.id)}
              className={`absolute size-4 rounded-full ring-4 transition hover:scale-110 ${pinClass}`}
              style={{ left: `${left}%`, top: `${top}%` }}
            />
          );
        })}

        {visiblePins.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center px-5 text-center text-sm font-semibold text-muted-fg">
            No map pins match this filter.
          </div>
        )}

        <p className="absolute bottom-4 left-4 text-xs font-bold uppercase tracking-[0.18em] text-brand-ink/60">
          Alexandria first
        </p>
      </div>

      {activeLocation && (
        <div className="rounded-lg bg-white p-3 text-xs shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-brand-ink">
                {activeLocation.name || activeLocation.title || "Location"}
              </p>
              <p className="mt-1 text-muted-fg">
                {[activeLocation.area, activeLocation.city].filter(Boolean).join(", ") || activeLocation.address || "Alexandria"}
              </p>
            </div>
            <span className="rounded-lg bg-brand-green/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-green">
              {activeLocation.priority || "prospect"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-semibold text-muted-fg">
            <span>Type: {formatLabel(activeLocation.partnerType)}</span>
            <span>Format: {formatLabel(activeLocation.recommendedFormat)}</span>
            <span>Model: {formatLabel(activeLocation.commercialModel)}</span>
            <span>Footfall: {activeLocation.footfallEstimate || "TBD"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/coming-soon"
      className="mt-7 inline-flex items-center gap-1.5 text-xs text-white/50 transition hover:text-brand-yellow"
    >
      <ArrowLeft className="size-3" />
      Back to MaMa Zainab
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-muted p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-green">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-default bg-surface-muted p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-green">
        {title}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function DeckComingSoonButton({
  label,
  className,
  href,
}: {
  label: string;
  className?: string;
  href?: string;
}) {
  const [active, setActive] = useState(false);
  const noticeId = useId();

  function flashNotice() {
    setActive(true);
    window.setTimeout(() => setActive(false), 2200);
  }

  if (href) {
    return (
      <a
        href={href}
        download
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className={`inline-flex items-center justify-center gap-2 rounded-lg text-xs font-bold uppercase tracking-[0.16em] transition ${className ?? ""}`}
      >
        <Download className="size-4" />
        {label}
      </a>
    );
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-describedby={noticeId}
        onClick={flashNotice}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        className={`inline-flex items-center justify-center gap-2 rounded-lg text-xs font-bold uppercase tracking-[0.16em] transition ${className ?? ""}`}
      >
        <Download className="size-4" />
        {label}
      </button>
      <span
        id={noticeId}
        role="status"
        className={`pointer-events-none absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-brand-yellow/50 bg-brand-ink px-3 py-2 text-left text-[11px] font-semibold normal-case leading-5 tracking-normal text-white shadow-xl transition ${
          active ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
        }`}
      >
        Partner deck download is not enabled for this portal session yet.
      </span>
    </span>
  );
}

function PortalCard({
  icon,
  eyebrow,
  title,
  body,
  actionHref,
  actionLabel,
  comingSoonAction,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
  comingSoonAction?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border-default bg-white p-6 shadow-sm">
      <div className="mb-4 inline-flex rounded-lg bg-brand-green/10 p-3 text-brand-green">
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-green">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-xl font-semibold leading-tight">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-6 text-muted-fg">{body}</p>
      {comingSoonAction && actionLabel && (
        <DeckComingSoonButton
          label={actionLabel}
          className="mt-6 bg-brand-yellow px-4 py-2.5 text-brand-ink hover:bg-yellow-300"
        />
      )}
      {actionHref && actionLabel && (
        <a
          href={actionHref}
          download={actionLabel.toLowerCase().includes("download") || undefined}
          target={actionHref.startsWith("http") ? "_blank" : undefined}
          rel={actionHref.startsWith("http") ? "noopener noreferrer" : undefined}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-yellow px-4 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-ink transition hover:bg-yellow-300"
        >
          {actionLabel}
          <ChevronRight className="size-3.5" />
        </a>
      )}
    </div>
  );
}
