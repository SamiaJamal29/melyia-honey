import type { Metadata } from "next";
import { Hanken_Grotesk, IBM_Plex_Mono, Newsreader } from "next/font/google";

import { BeeIntro } from "@/components/brand/bee-intro";
import { Providers } from "@/components/providers";

import "./globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const preferenceInitScript = `(()=>{try{const l=localStorage.getItem("melyia-locale");const t=localStorage.getItem("melyia-theme")==="dark"?"dark":"light";const m={ar:["ar-BH","rtl"],en:["en-MY","ltr"]};const p=m[l]||m.ar;document.documentElement.lang=p[0];document.documentElement.dir=p[1];document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch{}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Melyia — Pure Malaysian Honey",
    template: "%s | Melyia",
  },
  description:
    "Single-origin Malaysian honey, cold-extracted and delivered from trusted local harvests.",
  applicationName: "Melyia",
  keywords: ["Malaysian honey", "Tualang honey", "Kelulut honey", "Melyia"],
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar-BH" dir="rtl" data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning className={`${hanken.variable} ${newsreader.variable} ${plexMono.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: preferenceInitScript }} /></head>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
        <BeeIntro />
      </body>
    </html>
  );
}
