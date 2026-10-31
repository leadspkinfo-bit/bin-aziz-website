import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { InspectGuard } from "@/components/layout/InspectGuard";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { getSettings, pageKeyForHref } from "@/lib/settings";

// Public site chrome. The admin panel lives outside this group so it keeps
// working while the whole site is switched off.
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();

  // Whole site off → every public URL answers with the plain 404 (app/not-found.tsx).
  if (!settings.site_enabled) notFound();

  const hiddenHrefs = Object.entries(pageKeyForHref)
    .filter(([, key]) => !settings[key])
    .map(([href]) => href);

  return (
    <>
      <Header hiddenHrefs={hiddenHrefs} showSignup={settings.page_signup} />
      <main className="flex-1">{children}</main>
      <Footer hiddenHrefs={hiddenHrefs} />
      {settings.whatsapp_button && <WhatsAppFab />}
      {settings.block_inspect && <InspectGuard />}
    </>
  );
}
