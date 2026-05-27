export const brandTheme = {
  green: "#1B9B00",
  yellow: "#EFD200",
  red: "#E60000",
  ink: "#2C292A",
  cream: "#FFF8E7",
} as const;

export const brandPromptBlock = [
  "Photorealistic commercial food-chain photography, real-world materials, natural lighting, premium-casual Egyptian food brand, warm village-rooted identity, cinematic but believable, high detail, not CGI, not cartoon, not illustration.",
  `Brand palette: Mahshi Green ${brandTheme.green}, Brand Yellow ${brandTheme.yellow}, Brand Red ${brandTheme.red}, Ink ${brandTheme.ink}, Cream ${brandTheme.cream}.`,
  "Use MaMa Zainab visual language: green/yellow/cream brand system, clean kiosk surfaces, village-premium warmth, modern takeaway experience.",
  "Signature pattern: green-on-cream diamond weave plaid with thin yellow cross-threads, used subtly on apron, kiosk trim, packaging bands, napkins, staff accents, and lower-third-style presentation graphics.",
].join("\n\n");
