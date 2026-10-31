import type { Metadata } from "next";
import { HajjProvider } from "@/components/hajj/HajjContext";
import { HajjJourney } from "@/components/hajj/HajjJourney";
import { HajjPanel } from "@/components/hajj/HajjPanel";
import { PageHero } from "@/components/ui/PageHero";
import { requirePage } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Hajj Guide",
  description: "A step-by-step Hajj guide, from leaving home to the farewell Tawaf.",
};

export default async function HajjGuidePage() {
  await requirePage("page_hajj_guide");
  return (
    <>
      <PageHero
        arabic="لَبَّيْكَ اللّٰهُمَّ حَجًّا"
        eyebrow="Hajj guide"
        title={
          <>
            Your whole Hajj, <span className="text-gold-gradient italic">from home and back.</span>
          </>
        }
        text="Tell us when you land and how long you stay, then scroll through your journey. Drag the view to look around, and tap a + to fly in for the rulings of each place."
      />
      <HajjProvider>
        <div className="bg-night-950 pb-10">
          <div className="container-page">
            <HajjPanel />
          </div>
        </div>
        <HajjJourney />
      </HajjProvider>
    </>
  );
}
