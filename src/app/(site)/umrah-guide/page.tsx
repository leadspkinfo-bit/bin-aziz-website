import type { Metadata } from "next";
import { CallToAction } from "@/components/home/CallToAction";
import { PageHero } from "@/components/ui/PageHero";
import { ItineraryPanel } from "@/components/journey/ItineraryPanel";
import { JourneyProvider } from "@/components/journey/JourneyContext";
import { UmrahJourney } from "@/components/umrah/UmrahJourney";
import { getSettings, requirePage } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Umrah Guide",
  description:
    "A step-by-step Umrah guide — Ihram and the Miqat, arrival in Makkah, Tawaf, Sa’i between Safa and Marwah, and Halq or Taqsir — with du‘as, rules for men and women, and the history of the Kaaba.",
};

export default async function UmrahGuidePage() {
  await requirePage("page_umrah_guide");
  const { umrah_journey: journeyOn } = await getSettings();
  return (
    <>
      <PageHero
        arabic="لَبَّيْكَ اللّٰهُمَّ عُمْرَةً"
        eyebrow="Umrah guide"
        title={
          <>
            Every step of Umrah, <span className="text-gold-gradient italic">from your home to the Haram.</span>
          </>
        }
        text="Set your route, then scroll — from walking into your home airport, through the Miqat in the sky and the Tawaf, to the flight home. One screen, your whole journey."
      />
      {journeyOn && (
        <JourneyProvider>
          {/* your itinerary decides the order of the scenes on the stage below */}
          <div className="bg-night-950 pb-10">
            <div className="container-page">
              <ItineraryPanel />
            </div>
          </div>
          <UmrahJourney />
        </JourneyProvider>
      )}
      <section className={`bg-ivory-50 pb-20 ${journeyOn ? "" : "pt-20"}`}>
        <div className="container-page">
          <p className="mx-auto max-w-3xl rounded-2xl border border-gold-500/25 bg-ivory-100 p-5 text-center text-sm leading-relaxed text-ink/65">
            This guide follows the method commonly taught in Pakistan (Hanafi). Schools of thought differ on some details — every
            Bin Aziz group travels with a scholar who walks you through each step in person, so ask whenever you are unsure.
          </p>
        </div>
      </section>
      <div className="bg-ivory-100 pt-24 md:pt-32">
        <CallToAction />
      </div>
    </>
  );
}
