import type { Ref } from "react";
import { sai } from "@/lib/umrahGuide";
import { Callout, DuaCard, Numbered, PhaseShell } from "../shared";

export function SafaMarwah({ ref }: { ref?: Ref<HTMLElement> }) {
  return (
    <PhaseShell
      ref={ref}
      id="sai"
      step="05"
      eyebrow="Sa’i · between Safa and Marwah"
      title={
        <>
          In the footsteps <span className="italic text-gold-600">of Hajar (AS).</span>
        </>
      }
      arabic="السَّعْي"
    >
      <p>
        Sa’i follows Tawaf. It re-lives the search of Hajar (AS) for water for her son Isma‘il (AS) between these two hills, until
        Allah brought forth Zamzam. Wudu is recommended but not required.
      </p>

      <Numbered items={sai.steps} />

      <DuaCard dua={sai.verse} label="On Safa — first round only" />
      <DuaCard dua={sai.hills} label="On Safa and Marwah — facing the Kaaba, three times" dark />

      <Callout title="The green lights" tone="green">
        Overhead green lights mark the valley floor where Hajar (AS) ran. <strong>Men</strong> jog moderately between them in every
        round; <strong>women</strong> walk at a normal pace throughout.
      </Callout>
      <DuaCard dua={sai.greenLights} label="Between the green lights" />

      <div className="grid grid-cols-7 gap-1.5" aria-label="The seven rounds of Sa’i">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="rounded-xl border border-gold-500/25 bg-white p-2 text-center">
            <p className="font-display text-xl leading-none text-gold-600">{i + 1}</p>
            <p className="mt-1 text-[9px] leading-tight text-ink/60 md:text-[10px]">{i % 2 === 0 ? "Safa → Marwah" : "Marwah → Safa"}</p>
          </div>
        ))}
      </div>
    </PhaseShell>
  );
}
