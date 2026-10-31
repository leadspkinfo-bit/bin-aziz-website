import type { Ref } from "react";
import { transport } from "@/lib/umrahGuide";
import { Callout, Numbered, PhaseShell } from "../shared";

export function TransportSection({ ref }: { ref?: Ref<HTMLElement> }) {
  return (
    <PhaseShell
      ref={ref}
      id="transport"
      step="02"
      eyebrow="Airport arrival & Bin Aziz Transport"
      title={
        <>
          From Jeddah to Makkah — <span className="italic text-gold-600">we take it from here.</span>
        </>
      }
      arabic="جُدَّة ← مَكَّة"
    >
      <Numbered items={transport.steps} />

      <Callout title="On the road">
        You are in Ihram for the whole drive. Use the time for the Talbiyah, dhikr and du‘a — and rest if you can. Tawaf is only a few
        hours away.
      </Callout>

      <p>{transport.note}</p>
    </PhaseShell>
  );
}
