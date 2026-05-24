import type { Metadata } from "next";
import { Poppins, Cairo } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

/** Chinese Monoline — the MaMa Zainab brand display typeface */
const brandFont = localFont({
  src: "./fonts/ChineseMonoline.ttf",
  variable: "--font-brand",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "MaMa Zainab",
  description: "Homemade taste. Fast-food style. Opening late 2026 · Alexandria, Egypt.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    shortcut: "/favicon-32x32.png",
  },
  openGraph: {
    title: "MaMa Zainab",
    description: "Homemade taste. Fast-food style. Opening late 2026 · Alexandria, Egypt.",
    images: [{ url: "/favicon-512x512.png", width: 512, height: 512 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${cairo.variable} ${brandFont.variable}`}>
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton />
        <Analytics />
      </body>
    </html>
  );
}
