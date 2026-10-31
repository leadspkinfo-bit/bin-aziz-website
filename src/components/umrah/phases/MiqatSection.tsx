import type { Ref } from "react";
import { miqat, niyyah, talbiyah } from "@/lib/umrahGuide";
import { Callout, Checklist, DuaCard, Numbered, PhaseShell } from "../shared";

export function MiqatSection({ ref }: { ref?: Ref<HTMLElement> }) {
  return (
    <PhaseShell
      ref={ref}
      id="miqat"
      step="01"
      eyebrow="Departure & the Miqat · in the air"
      title={
        <>
          Ihram at home, <span className="italic text-gold-600">intention in the sky.</span>
        </>
      }
      arabic="الْمِيقَات"
    >
      <div>
        <h3 className="font-display text-2xl text-night-900">Before you leave home</h3>
        <div className="mt-5">
          <Numbered items={miqat.preparation} />
        </div>
      </div>

      <Callout title="The moment that matters">
        Wearing the Ihram sheets is only preparation. You actually <strong className="text-ivory-50">enter Ihram</strong> when you make
        the <strong className="text-ivory-50">Niyyah</strong> and say the <strong className="text-ivory-50">Talbiyah</strong> — and this
        must happen <strong className="text-gold-300">before the plane crosses the Miqat</strong>. Crossing it without Ihram means a
        penalty (dam) is due.
      </Callout>

      <p>{miqat.note}</p>

      <DuaCard dua={niyyah} label="Niyyah — intention for Umrah" />
      <DuaCard dua={talbiyah} label="Talbiyah — say it aloud (men), softly (women)" dark />

      <div>
        <h3 className="font-display text-2xl text-night-900">Now in Ihram — avoid</h3>
        <div className="mt-5 grid gap-x-8 sm:grid-cols-2">
          <Checklist items={miqat.restrictions} tone="rose" />
        </div>
      </div>
    </PhaseShell>
  );
}
