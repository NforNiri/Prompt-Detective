import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Courier_Prime, Geist } from "next/font/google";
import { en } from "@/lib/i18n/en";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${SITE_URL}`),
  title: en.meta.title,
  description: en.meta.description,
  applicationName: en.appName,
  // Icons come from app/icon.svg and app/apple-icon.png, the image from app/opengraph-image.tsx.
  openGraph: {
    type: "website",
    siteName: en.appName,
    title: en.meta.title,
    description: en.meta.description,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: en.meta.title, description: en.meta.description },
  appleWebApp: { capable: true, title: en.appName, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" dir="ltr" className={`${geistSans.variable} ${courierPrime.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        {/* Page views and Web Vitals only, on Vercel deployments. Game events go through track() to PostHog. */}
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  );
}
