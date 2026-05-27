import { brandPromptBlock } from "@/lib/brand/theme";

export type BrandMediaPrompt = {
  id: string;
  title: string;
  usage: string;
  prompt: string;
};

function withBrandBlock(prompt: string): string {
  return `${prompt}\n\n${brandPromptBlock}`;
}

export const PARTNER_PRESENTATION_PROMPTS: BrandMediaPrompt[] = [
  {
    id: "main_partner_hero_kiosk",
    title: "Main partner hero kiosk",
    usage: "Cover slide, deck preview hero, downloadable deck thumbnail",
    prompt: withBrandBlock(
      "A premium MaMa Zainab food kiosk inside a modern shopping mall corridor, 3m x 2m compact footprint, green and yellow branded fascia, cream surfaces, digital menu board, sauce station, takeaway counter, branded packaging display, warm inviting lighting, clean polished floor, subtle shoppers in background, high-footfall retail environment, realistic commercial photography, 16:9.",
    ),
  },
  {
    id: "mall_food_court_kiosk",
    title: "Mall food court kiosk",
    usage: "Mall partner type mockup",
    prompt: withBrandBlock(
      "MaMa Zainab kiosk in a busy mall food court, surrounded by seating and families, branded green/yellow/cream kiosk, digital menu screens, staff serving takeaway boxes, warm appetizing lighting, premium-casual food court environment, realistic photo, 16:9.",
    ),
  },
  {
    id: "sports_club_kiosk",
    title: "Sports club kiosk",
    usage: "Club partner type mockup",
    prompt: withBrandBlock(
      "MaMa Zainab kiosk at an Egyptian sports club outdoor family zone, evening warm lights, families and kids nearby, green/yellow kiosk, branded counter, takeaway bags, comfortable seating, club atmosphere, realistic lifestyle photography, 16:9.",
    ),
  },
  {
    id: "alexandria_rollout_map",
    title: "Alexandria rollout map",
    usage: "Expansion Plan slide",
    prompt: withBrandBlock(
      "Stylized but realistic presentation graphic of Alexandria, Egypt coastline map, cream background, green route lines, yellow highlighted districts, branded MaMa Zainab map pins, premium investor presentation style, clean infographic, 16:9.",
    ),
  },
  {
    id: "kiosk_dimensions_infographic",
    title: "Kiosk dimensions infographic",
    usage: "Kiosk Format slide",
    prompt: withBrandBlock(
      "Presentation infographic showing MaMa Zainab kiosk dimensions, 3m width, 2m depth, 2.5m height, clean technical overlay, green/yellow/cream brand colors, front and side view, premium partner model style, 16:9.",
    ),
  },
  {
    id: "staff_serving_at_kiosk",
    title: "Staff serving at kiosk",
    usage: "Operations and CTA support",
    prompt: withBrandBlock(
      "Friendly MaMa Zainab staff member serving a customer at the branded kiosk counter, staff wearing cream shirt and green-yellow diamond plaid apron, branded takeaway box on counter, warm smile, realistic commercial photography, 16:9.",
    ),
  },
  {
    id: "partner_location_assessment",
    title: "Partner meeting / location assessment",
    usage: "CTA support",
    prompt: withBrandBlock(
      "Business meeting between MaMa Zainab representative and property manager inside a mall corridor, kiosk plan on tablet, branded presentation folder, professional partnership mood, realistic corporate lifestyle photo, 16:9.",
    ),
  },
];
