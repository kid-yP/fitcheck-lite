import { ClerkProvider } from "@clerk/nextjs";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { Shell } from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitcheck Lite: your wardrobe, organised",
  description:
    "Photograph your clothes, build outfits on a dress form, and get styling suggestions based on weather and occasion. Free and built with Next.js 16, React 19, Convex and Clerk.",
  openGraph: {
    title: "Fitcheck Lite",
    description: "Wear more of what you own. A free, privacy-friendly digital wardrobe.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

// Runs before first paint so the page never flashes the wrong theme.
const THEME_SCRIPT = `try{var t=localStorage.getItem("fc-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <ClerkProvider>
          <ConvexClientProvider>
            <Shell>{children}</Shell>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
