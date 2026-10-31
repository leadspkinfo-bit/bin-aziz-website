import type { Metadata, Viewport } from "next";
import { Amiri, Cormorant_Garamond, Manrope } from "next/font/google";
import { DialogProvider } from "@/components/ui/Dialogs";
import { site } from "@/lib/site";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | Umrah, Ticketing & Visas — Lahore`,
    template: `%s | ${site.shortName} Tourism`,
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: "en_PK",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1128",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${manrope.variable} ${amiri.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <DialogProvider>{children}</DialogProvider>
      </body>
    </html>
  );
}
