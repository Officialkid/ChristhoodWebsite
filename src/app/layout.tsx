import type { Metadata, Viewport } from "next";
import { Archivo, Literata } from "next/font/google";
import { site } from "@/content/site";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// Archivo: a sturdy grotesque with a width axis, used for headings, navigation and labels.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
// Literata: a text serif made for reading on screens, used for long passages.
const literata = Literata({ subsets: ["latin"], axes: ["opsz"], variable: "--font-literata", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | Believe. Belong. Become.`, template: `%s | ${site.name}` },
  description:
    "Christhood International Outfield Ministry: a Saturday fellowship in Nairobi CBD, mentorship for children, teens and young adults, counselling, missions and humanitarian work.",
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.name, locale: "en_KE", images: [{ url: "/img/main-poster-christhood.webp", width: 1080, height: 1350 }] },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = { themeColor: "#2d0f5a", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${literata.variable}`}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
