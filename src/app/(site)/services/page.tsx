import type { Metadata } from "next";
import { CallToAction } from "@/components/home/CallToAction";
import { ServicesSection } from "@/components/home/ServicesSection";
import { PageHero } from "@/components/ui/PageHero";
import { requirePage } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Services",
  description: "Umrah packages, worldwide ticketing, visit visas and religious travel from Lahore.",
};

export default async function ServicesPage() {
  await requirePage("page_services");
  return (
    <>
      <PageHero
        eyebrow="Our services"
        title={
          <>
            Religious travel, visas & ticketing — <span className="text-gold-gradient italic">under one roof.</span>
          </>
        }
        text="Every service we offer is backed with professional care and deep Islamic ethics."
      />
      <ServicesSection />
      <div className="bg-ivory-100 pt-24 md:pt-32">
        <CallToAction />
      </div>
    </>
  );
}
