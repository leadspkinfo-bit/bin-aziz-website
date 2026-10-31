import { Achievements } from "@/components/home/Achievements";
import { CallToAction } from "@/components/home/CallToAction";
import { Fleet } from "@/components/home/Fleet";
import { FleetShowcase } from "@/components/home/FleetShowcase";
import { Hero } from "@/components/home/Hero";
import { Intro } from "@/components/home/Intro";
import { Principles } from "@/components/home/Principles";
import { ServicesSection } from "@/components/home/ServicesSection";
import { TicketJourney } from "@/components/home/TicketJourney";
import { getSettings } from "@/lib/settings";

export default async function Home() {
  const s = await getSettings();
  // The ticket has its own switch, independent of the intro switch. The services
  // join the journey (voucher → stack of documents) only when the intro is on too.
  const servicesInJourney = s.ticket_3d && s.home_intro && s.home_services;
  return (
    <>
      {s.ticket_3d ? (
        <TicketJourney withIntro={s.home_intro} withServices={servicesInJourney}>
          <Hero immersive />
          {s.home_intro && <Intro immersive />}
          {servicesInJourney && <ServicesSection immersive />}
        </TicketJourney>
      ) : (
        <>
          <Hero />
          {s.home_intro && <Intro />}
        </>
      )}
      {s.home_services && !servicesInJourney && <ServicesSection />}
      {s.home_fleet && (s.three_d ? <FleetShowcase /> : <Fleet />)}
      {s.home_achievements && <Achievements />}
      {s.home_principles && <Principles />}
      {s.home_cta && <CallToAction />}
    </>
  );
}
