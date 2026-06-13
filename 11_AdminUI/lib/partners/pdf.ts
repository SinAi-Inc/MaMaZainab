import type { Branch } from "@/lib/branches/schema";
import type { BrandMediaAsset } from "@/lib/brand-media/schema";
import { DEFAULT_PARTNER_PORTAL_SLIDES, type PartnerPortalSlide, type PartnerSettings } from "./schema";

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const INK = "0.172 0.161 0.165";
const GREEN = "0.106 0.608 0";
const GREEN_DEEP = "0.063 0.329 0.063";
const YELLOW = "0.937 0.824 0";
const CREAM = "1 0.973 0.906";
const WHITE = "1 1 1";
const MUTED = "0.365 0.392 0.451";
const RED = "0.792 0.058 0.058";

type PdfPage = {
  commands: string[];
};

function pdfEscape(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function normalizeText(value: string) {
  return value.replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}

function textWidth(text: string, fontSize: number) {
  return normalizeText(text).length * fontSize * 0.48;
}

function wrapText(text: string, maxWidth: number, fontSize: number) {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (textWidth(next, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function setFill(page: PdfPage, color: string) {
  page.commands.push(`${color} rg`);
}

function setStroke(page: PdfPage, color: string) {
  page.commands.push(`${color} RG`);
}

function rect(page: PdfPage, x: number, y: number, w: number, h: number, color: string) {
  setFill(page, color);
  page.commands.push(`${x} ${y} ${w} ${h} re f`);
}

function strokeRect(page: PdfPage, x: number, y: number, w: number, h: number, color: string, width = 1) {
  setStroke(page, color);
  page.commands.push(`${width} w`);
  page.commands.push(`${x} ${y} ${w} ${h} re S`);
}

function line(page: PdfPage, x1: number, y1: number, x2: number, y2: number, color: string, width = 1) {
  setStroke(page, color);
  page.commands.push(`${width} w`);
  page.commands.push(`${x1} ${y1} m ${x2} ${y2} l S`);
}

function circle(page: PdfPage, cx: number, cy: number, r: number, color: string, stroke = false) {
  const c = r * 0.5522847498;
  if (stroke) setStroke(page, color);
  else setFill(page, color);
  page.commands.push(
    `${cx + r} ${cy} m`,
    `${cx + r} ${cy + c} ${cx + c} ${cy + r} ${cx} ${cy + r} c`,
    `${cx - c} ${cy + r} ${cx - r} ${cy + c} ${cx - r} ${cy} c`,
    `${cx - r} ${cy - c} ${cx - c} ${cy - r} ${cx} ${cy - r} c`,
    `${cx + c} ${cy - r} ${cx + r} ${cy - c} ${cx + r} ${cy} c`,
    stroke ? "S" : "f",
  );
}

function text(
  page: PdfPage,
  value: string,
  x: number,
  y: number,
  options: { size?: number; color?: string; font?: "regular" | "bold"; align?: "left" | "center" } = {},
) {
  const size = options.size ?? 12;
  const color = options.color ?? INK;
  const font = options.font === "bold" ? "F2" : "F1";
  const normalized = normalizeText(value);
  const tx = options.align === "center" ? x - textWidth(normalized, size) / 2 : x;
  setFill(page, color);
  page.commands.push("BT", `/${font} ${size} Tf`, `${tx} ${y} Td`, `(${pdfEscape(normalized)}) Tj`, "ET");
}

function wrappedText(
  page: PdfPage,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  options: { size?: number; color?: string; font?: "regular" | "bold"; lineHeight?: number; maxLines?: number } = {},
) {
  const size = options.size ?? 12;
  const lineHeight = options.lineHeight ?? size + 5;
  const lines = wrapText(value, maxWidth, size).slice(0, options.maxLines ?? 99);
  lines.forEach((item, index) => {
    text(page, item, x, y - index * lineHeight, {
      size,
      color: options.color,
      font: options.font,
    });
  });
  return y - lines.length * lineHeight;
}

function card(page: PdfPage, x: number, y: number, w: number, h: number, title: string, body: string) {
  rect(page, x, y, w, h, WHITE);
  strokeRect(page, x, y, w, h, "0.86 0.88 0.84", 0.8);
  text(page, title, x + 18, y + h - 28, { size: 10, color: GREEN, font: "bold" });
  wrappedText(page, body, x + 18, y + h - 52, w - 36, { size: 14, font: "bold", lineHeight: 18, maxLines: 3 });
}

function plaid(page: PdfPage, x: number, y: number, w: number, h: number, cell = 28, opacity = false) {
  for (let yy = y; yy < y + h; yy += cell) {
    for (let xx = x; xx < x + w; xx += cell) {
      const even = (Math.floor((xx - x) / cell) + Math.floor((yy - y) / cell)) % 2 === 0;
      rect(page, xx, yy, Math.min(cell, x + w - xx), Math.min(cell, y + h - yy), even ? GREEN : YELLOW);
    }
  }
  if (opacity) rect(page, x, y, w, h, "0 0.18 0");
}

function brandHeader(page: PdfPage, settings: PartnerSettings, slideLabel: string) {
  rect(page, 0, PAGE_HEIGHT - 64, PAGE_WIDTH, 64, INK);
  rect(page, 0, PAGE_HEIGHT - 68, PAGE_WIDTH, 4, YELLOW);
  circle(page, 42, PAGE_HEIGHT - 32, 17, GREEN);
  text(page, "M", 34, PAGE_HEIGHT - 40, { size: 22, color: WHITE, font: "bold" });
  text(page, "MaMa Zainab", 70, PAGE_HEIGHT - 38, { size: 16, color: WHITE, font: "bold" });
  text(page, slideLabel.toUpperCase(), PAGE_WIDTH - 36, PAGE_HEIGHT - 38, {
    size: 9,
    color: YELLOW,
    font: "bold",
    align: "center",
  });
  text(page, settings.presentationVersion || "Partner Deck", PAGE_WIDTH - 118, PAGE_HEIGHT - 38, {
    size: 9,
    color: "0.75 0.79 0.81",
    font: "bold",
  });
}

function brandFooter(page: PdfPage, pageNumber: number, pageCount: number) {
  rect(page, 0, 0, PAGE_WIDTH, 34, INK);
  text(page, "(c) 2026 MaMa Zainab - Confidential - For Authorized Partners Only", PAGE_WIDTH / 2, 13, {
    size: 8,
    color: "0.75 0.79 0.81",
    align: "center",
  });
  text(page, `${pageNumber} / ${pageCount}`, PAGE_WIDTH - 44, 13, { size: 8, color: YELLOW, font: "bold" });
}

function featuredBranches(settings: PartnerSettings, branches: Branch[]) {
  return settings.featuredLocationIds.length > 0
    ? branches.filter((branch) => settings.featuredLocationIds.includes(branch.id))
    : branches.filter((branch) => branch.showInPartnerPortal).slice(0, 8);
}

function mediaCount(mediaAssets: BrandMediaAsset[], predicate: (asset: BrandMediaAsset) => boolean) {
  return mediaAssets.filter((asset) => asset.isActive && predicate(asset)).length;
}

function coverSlide(settings: PartnerSettings, mediaAssets: BrandMediaAsset[]) {
  const page: PdfPage = { commands: [] };
  rect(page, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, CREAM);
  plaid(page, 510, 72, 260, 400, 32);
  rect(page, 538, 100, 204, 344, WHITE);
  strokeRect(page, 538, 100, 204, 344, GREEN, 2);
  text(page, "KIOSK", 640, 356, { size: 28, color: GREEN, font: "bold", align: "center" });
  text(page, "3m x 2m", 640, 325, { size: 15, font: "bold", align: "center" });
  rect(page, 576, 178, 128, 72, GREEN);
  text(page, "MAMA", 640, 214, { size: 20, color: WHITE, font: "bold", align: "center" });

  brandHeader(page, settings, "Partner Presentation");
  text(page, "PARTNER OPPORTUNITY", 58, 444, { size: 10, color: GREEN, font: "bold" });
  wrappedText(page, settings.presentationTitle || "MaMa Zainab Partnership", 58, 404, 380, {
    size: 34,
    font: "bold",
    lineHeight: 40,
    maxLines: 3,
  });
  wrappedText(page, settings.presentationSubtitle || "Authentic Mahshi. Homemade Taste. Fast-Food Speed.", 58, 278, 380, {
    size: 16,
    color: MUTED,
    lineHeight: 22,
    maxLines: 3,
  });
  card(page, 58, 126, 132, 86, "FORMAT", "Compact kiosk");
  card(page, 204, 126, 132, 86, "MEDIA", `${mediaAssets.filter((asset) => asset.isActive).length} active assets`);
  card(page, 350, 126, 132, 86, "CITY", "Alexandria first");
  brandFooter(page, 1, 6);
  return page;
}

function slidePage(slide: PartnerPortalSlide, index: number, settings: PartnerSettings, branches: Branch[], mediaAssets: BrandMediaAsset[]) {
  const page: PdfPage = { commands: [] };
  rect(page, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, CREAM);
  brandHeader(page, settings, slide.eyebrow || `Slide ${index + 1}`);
  rect(page, 52, 88, 348, 400, WHITE);
  strokeRect(page, 52, 88, 348, 400, "0.86 0.88 0.84", 0.8);
  text(page, (slide.eyebrow || "Partner Story").toUpperCase(), 82, 430, { size: 10, color: GREEN, font: "bold" });
  wrappedText(page, slide.title, 82, 388, 286, { size: 26, font: "bold", lineHeight: 31, maxLines: 3 });
  wrappedText(page, slide.body, 82, 268, 280, { size: 14, color: MUTED, lineHeight: 20, maxLines: 7 });

  rect(page, 430, 88, 360, 400, GREEN_DEEP);
  plaid(page, 430, 88, 360, 400, 32);
  rect(page, 466, 124, 288, 328, WHITE);
  text(page, "VISUAL DIRECTION", 492, 402, { size: 10, color: GREEN, font: "bold" });
  wrappedText(page, slide.visual || "Brand visual", 492, 364, 226, { size: 22, font: "bold", lineHeight: 27, maxLines: 4 });
  line(page, 492, 256, 726, 256, YELLOW, 4);

  if (slide.id === "rollout") {
    const featured = featuredBranches(settings, branches).slice(0, 5);
    let y = 218;
    featured.forEach((branch, row) => {
      text(page, `${row + 1}. ${branch.name}`, 492, y, { size: 12, font: "bold" });
      text(page, `${branch.district || branch.city || "Alexandria"} / Kiosk #${branch.kioskNumber}`, 492, y - 16, {
        size: 9,
        color: MUTED,
      });
      y -= 38;
    });
  } else {
    card(page, 492, 162, 104, 70, "Deck", settings.presentationVersion || "Live");
    card(page, 608, 162, 104, 70, "Assets", String(mediaAssets.filter((asset) => asset.isActive).length));
  }

  brandFooter(page, index + 1, 6);
  return page;
}

function summarySlide(settings: PartnerSettings, branches: Branch[], mediaAssets: BrandMediaAsset[]) {
  const page: PdfPage = { commands: [] };
  const featured = featuredBranches(settings, branches).slice(0, 6);
  rect(page, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, CREAM);
  brandHeader(page, settings, "Rollout Summary");
  text(page, (settings.portalLocationsEyebrow || "Featured Locations").toUpperCase(), 58, 458, {
    size: 10,
    color: GREEN,
    font: "bold",
  });
  text(page, settings.portalLocationsTitle || "Partner-ready rollout points", 58, 426, { size: 28, font: "bold" });

  let y = 360;
  featured.forEach((branch) => {
    rect(page, 58, y - 18, 430, 44, WHITE);
    strokeRect(page, 58, y - 18, 430, 44, "0.86 0.88 0.84", 0.6);
    text(page, branch.name, 76, y + 6, { size: 12, font: "bold" });
    text(page, `${branch.district || branch.city || "Alexandria"} / Kiosk #${branch.kioskNumber} / ${branch.status}`, 76, y - 10, {
      size: 9,
      color: MUTED,
    });
    y -= 55;
  });

  rect(page, 530, 116, 240, 330, INK);
  text(page, "MEDIA READINESS", 560, 396, { size: 10, color: YELLOW, font: "bold" });
  card(page, 560, 306, 176, 58, "Presentation", `${mediaAssets.filter((asset) => asset.isActive).length} active media assets`);
  card(page, 560, 232, 176, 58, "Kiosk / Map", `${mediaCount(mediaAssets, (asset) => asset.category === "kiosk" || asset.category === "map")} assets`);
  card(page, 560, 158, 176, 58, "Proof", `${mediaCount(mediaAssets, (asset) => asset.category === "packaging" || asset.category === "operations")} assets`);
  brandFooter(page, 6, 6);
  return page;
}

function buildPages(input: {
  settings: PartnerSettings;
  branches: Branch[];
  mediaAssets: BrandMediaAsset[];
}) {
  const slides = input.settings.portalSlides.length > 0 ? input.settings.portalSlides : DEFAULT_PARTNER_PORTAL_SLIDES;
  const pages = [
    coverSlide(input.settings, input.mediaAssets),
    slidePage(slides[0] ?? DEFAULT_PARTNER_PORTAL_SLIDES[0], 1, input.settings, input.branches, input.mediaAssets),
    slidePage(slides[1] ?? DEFAULT_PARTNER_PORTAL_SLIDES[1], 2, input.settings, input.branches, input.mediaAssets),
    slidePage(slides[2] ?? DEFAULT_PARTNER_PORTAL_SLIDES[2], 3, input.settings, input.branches, input.mediaAssets),
    slidePage(slides[3] ?? DEFAULT_PARTNER_PORTAL_SLIDES[3], 4, input.settings, input.branches, input.mediaAssets),
    summarySlide(input.settings, input.branches, input.mediaAssets),
  ];
  return pages;
}

function contentStream(page: PdfPage) {
  return page.commands.join("\n");
}

export function buildPartnerPresentationPdf(input: {
  settings: PartnerSettings;
  branches: Branch[];
  mediaAssets: BrandMediaAsset[];
}) {
  const pages = buildPages(input);
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pages.forEach((page) => {
    const pageObjId = objects.length + 1;
    const contentObjId = pageObjId + 1;
    pageObjectIds.push(pageObjId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>`,
    );
    const stream = contentStream(page);
    objects.push(`<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "utf8");
}
