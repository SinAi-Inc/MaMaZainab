import type { Branch } from "@/lib/branches/schema";
import type { BrandMediaAsset } from "@/lib/brand-media/schema";
import type { PartnerSettings } from "./schema";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 56;
const LINE_HEIGHT = 15;
const MAX_CHARS = 92;

function pdfEscape(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function wrapLine(text: string, max = MAX_CHARS) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function addWrapped(lines: string[], text: string, max = MAX_CHARS) {
  for (const line of wrapLine(text, max)) lines.push(line);
}

function buildDeckLines({
  settings,
  branches,
  mediaAssets,
}: {
  settings: PartnerSettings;
  branches: Branch[];
  mediaAssets: BrandMediaAsset[];
}) {
  const activeMedia = mediaAssets.filter((asset) => asset.isActive);
  const featured =
    settings.featuredLocationIds.length > 0
      ? branches.filter((branch) => settings.featuredLocationIds.includes(branch.id))
      : branches.filter((branch) => branch.showInPartnerPortal).slice(0, 8);

  const lines: string[] = [
    settings.presentationTitle || "MaMa Zainab Partner Presentation",
    settings.presentationSubtitle || "Authentic Mahshi. Homemade Taste. Fast-Food Speed.",
    "",
    `Version: ${settings.presentationVersion || "v0.1"}`,
    `Generated: ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`,
    settings.presentationUpdatedAt ? `Last updated: ${settings.presentationUpdatedAt}` : "",
    "",
    "1. Partner Opportunity",
  ].filter(Boolean);

  addWrapped(
    lines,
    "MaMa Zainab is a compact Egyptian comfort-food kiosk concept designed for high-footfall partner locations: malls, clubs, cinemas, universities, compounds, petrol stations, and hypermarkets.",
  );
  lines.push("");
  lines.push("2. Brand Promise");
  addWrapped(
    lines,
    "The Village Way, or Not at All. Authentic mahshi and oriental home-food served with homemade warmth, operational discipline, and fast-food speed.",
  );
  lines.push("");
  lines.push("3. Kiosk Format");
  lines.push("- Suggested footprint: 3m x 2m");
  lines.push("- Suggested height: 2.5m");
  lines.push("- Works as kiosk, corner, activation, or pilot location");
  lines.push("- Visual system: green/yellow plaid, strong logo lockup, warm Egyptian character world");
  lines.push("");
  lines.push("4. Partner Benefits");
  [
    "Activates unused or transitional retail space.",
    "Adds a local comfort-food category with family appeal.",
    "Supports tasting campaigns and short pilot launches.",
    "Creates a photo-friendly tenant with strong brand recall.",
    "Can fit fixed rent, revenue share, minimum guarantee, or seasonal activation models.",
  ].forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  lines.push("5. Featured Locations");

  if (featured.length > 0) {
    featured.slice(0, 10).forEach((branch) => {
      const place = [branch.district, branch.city].filter(Boolean).join(", ") || branch.address || "Alexandria";
      addWrapped(lines, `- ${branch.name} / Kiosk #${branch.kioskNumber || "TBD"} / ${place} / ${branch.status}`);
    });
  } else {
    lines.push("- Featured partner locations are not selected yet.");
  }

  lines.push("");
  lines.push("6. Media Readiness");
  lines.push(`- Active presentation media assets: ${activeMedia.length}`);
  lines.push(`- Cover visuals: ${activeMedia.filter((asset) => asset.slideId === "cover").length}`);
  lines.push(`- Rollout/map visuals: ${activeMedia.filter((asset) => asset.slideId === "rollout" || asset.category === "map").length}`);
  lines.push(`- Packaging/operations proof: ${activeMedia.filter((asset) => asset.category === "packaging" || asset.category === "operations").length}`);
  lines.push("");
  lines.push("7. Next Step");
  addWrapped(
    lines,
    "Request a location assessment, schedule a tasting session, or contact partnerships to discuss the right commercial model and pilot plan.",
  );
  if (settings.contactEmail) lines.push(`Email: ${settings.contactEmail}`);
  if (settings.contactPhone) lines.push(`Phone / WhatsApp: ${settings.contactPhone}`);
  if (settings.bookingUrl) lines.push(`Booking: ${settings.bookingUrl}`);
  if (settings.assessmentUrl) lines.push(`Assessment: ${settings.assessmentUrl}`);
  lines.push("");
  lines.push("Confidential - for authorized partners only.");

  return lines;
}

function paginate(lines: string[]) {
  const linesPerPage = Math.floor((PAGE_HEIGHT - MARGIN * 2) / LINE_HEIGHT);
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  return pages.length > 0 ? pages : [[]];
}

function contentStream(lines: string[], pageNumber: number, pageCount: number) {
  const commands = [
    "BT",
    "/F1 11 Tf",
    `${MARGIN} ${PAGE_HEIGHT - MARGIN} Td`,
    "14 TL",
  ];

  lines.forEach((line, index) => {
    const isTitle = pageNumber === 1 && index === 0;
    const isSubtitle = pageNumber === 1 && index === 1;
    if (isTitle) commands.push("/F1 20 Tf");
    if (isSubtitle) commands.push("/F1 12 Tf");
    if (!isTitle && !isSubtitle) commands.push("/F1 11 Tf");
    commands.push(`(${pdfEscape(line)}) Tj`);
    commands.push("T*");
  });

  commands.push("/F1 8 Tf");
  commands.push(`${MARGIN - 0} ${-(PAGE_HEIGHT - MARGIN * 2 - 18)} Td`);
  commands.push(`(Page ${pageNumber} of ${pageCount}) Tj`);
  commands.push("ET");
  return commands.join("\n");
}

export function buildPartnerPresentationPdf(input: {
  settings: PartnerSettings;
  branches: Branch[];
  mediaAssets: BrandMediaAsset[];
}) {
  const pages = paginate(buildDeckLines(input));
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((pageLines, index) => {
    const pageObjId = objects.length + 1;
    const contentObjId = pageObjId + 1;
    pageObjectIds.push(pageObjId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjId} 0 R >>`,
    );
    const stream = contentStream(pageLines, index + 1, pages.length);
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
