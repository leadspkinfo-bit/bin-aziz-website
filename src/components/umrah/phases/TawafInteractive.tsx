import type { Ref } from "react";
import { haramCategories, haramHistoricalData } from "@/lib/haramHistoricalData";
import { tawaf } from "@/lib/umrahGuide";
import { Callout, DuaCard, Numbered, PhaseShell, rich } from "../shared";

export function TawafInteractive({ ref, onHotspot }: { ref?: Ref<HTMLElement>; onHotspot: (id: string) => void }) {
  return (
    <PhaseShell
      ref={ref}
      id="tawaf"
      step="04"
      eyebrow="Tawaf · seven rounds around the Kaaba"
      title={
        <>
          The House of Allah, <span className="italic text-gold-600">on your left.</span>
        </>
      }
      arabic="الطَّوَاف"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {tawaf.rules.map((r) => (
          <div key={r.title} className="rounded-2xl border border-night-900/10 bg-white p-5 shadow-[0_10px_30px_-20px_rgb(10_17_40/0.4)]">
            <p className="font-semibold text-night-900">{r.title}</p>
            <p className="mt-1.5 text-sm">{r.text}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-display text-2xl text-night-900">Explore Masjid al-Haram</h3>
        <p className="mt-2 text-sm">
          Tap a <span className="font-semibold text-gold-600">+</span> in the 3D view, or choose below — the camera walks you up to it and opens
          its full history.
        </p>
        <div className="mt-6 space-y-6">
          {haramCategories.map((cat) => (
            <div key={cat}>
              <p className="text-[11px] font-semibold tracking-[0.3em] text-gold-600 uppercase">{cat}</p>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {haramHistoricalData
                  .filter((h) => h.category === cat)
                  .map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => onHotspot(h.id)}
                      className="group flex items-center gap-3.5 rounded-2xl border border-gold-500/30 bg-ivory-100 p-3.5 text-left transition hover:-translate-y-0.5 hover:border-gold-500 hover:bg-white hover:shadow-lg"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-night-900 font-bold text-gold-400 transition group-hover:bg-gold-500 group-hover:text-night-950">
                        +
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-night-900">{h.name}</span>
                        <span className="block text-xs text-ink/60">{rich(h.tagline)}</span>
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-2xl text-night-900">Step by step</h3>
        <div className="mt-5">
          <Numbered items={tawaf.steps} />
        </div>
      </div>

      <DuaCard dua={tawaf.rabbana} label="Between the Rukn Yamani and the Black Stone" />

      <Callout title="Zamzam" tone="green">
        “{tawaf.zamzamVirtue.text}” — {tawaf.zamzamVirtue.source}. Drink to your fill, facing the Kaaba, and ask Allah for what you
        need.
      </Callout>
      <DuaCard dua={tawaf.zamzam} label="Du‘a when drinking Zamzam" />
    </PhaseShell>
  );
}
