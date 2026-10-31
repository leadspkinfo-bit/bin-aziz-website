import type { Ref } from "react";
import { hotel } from "@/lib/umrahGuide";
import { Callout, DuaCard, Numbered, PhaseShell } from "../shared";

export function HotelSection({ ref }: { ref?: Ref<HTMLElement> }) {
  return (
    <PhaseShell
      ref={ref}
      id="hotel"
      step="03"
      eyebrow="Arrival in Makkah & hotel check-in"
      title={
        <>
          Rest first — <span className="italic text-gold-600">then answer the call.</span>
        </>
      }
      arabic="مَكَّةُ الْمُكَرَّمَة"
    >
      <Numbered items={hotel.steps} />

      <Callout title="Still in Ihram">
        Checking in, resting and showering (without scented soap) are all fine — but every restriction of Ihram stays in place until
        your hair is cut at the end of Umrah.
      </Callout>

      <div>
        <h3 className="font-display text-2xl text-night-900">Entering Masjid al-Haram</h3>
        <p className="mt-3">
          Step in with your right foot and recite the du‘a below. When your eyes first fall on the Kaaba, stop and ask Allah for
          whatever you wish — this is a moment to make the du‘a closest to your heart.
        </p>
      </div>
      <DuaCard dua={hotel.entry} label="Du‘a on entering the masjid" />
    </PhaseShell>
  );
}
