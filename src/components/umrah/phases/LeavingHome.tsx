import { airportSteps, LEAVING_DUA, packingList } from "@/lib/journey/leavingHome";
import { DuaCard, rich } from "../shared";

/** Card for the packing beat: everything to check before locking the door, item by item. */
export function PackingCard({ ihram }: { ihram: boolean }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold tracking-[0.3em] text-gold-600 uppercase">Step zero · at home</p>
      <h2 className="mt-2 font-display text-3xl leading-tight text-night-900 md:text-4xl">
        Before you leave home, <span className="italic text-gold-600">check every pocket.</span>
      </h2>
      <p className="mt-4 text-[15px] leading-relaxed text-ink/75">
        Lay everything out on the bed the night before and tick it off. Most problems at the airport come from one missing paper — and most of
        them are fixed by a single folder that never leaves your hand.
      </p>

      {packingList(ihram).map((group) => (
        <section key={group.group} className="mt-8">
          <h3 className="text-xs font-semibold tracking-[0.25em] text-gold-600 uppercase">{group.group}</h3>
          <ul className="mt-3 space-y-3">
            {group.items.map((it) => (
              <li
                key={it.id}
                className={`rounded-2xl border p-4 ${it.key ? "border-gold-500 bg-gradient-to-br from-gold-400/20 to-ivory-100 shadow-[0_10px_30px_-18px_rgb(169_132_63/0.8)]" : "border-night-900/10 bg-white"}`}
              >
                <p className="flex items-center gap-2 font-semibold text-night-900">
                  <span className="grid size-5 place-items-center rounded-full bg-emerald-500 text-[11px] text-white" aria-hidden>
                    ✓
                  </span>
                  {it.label}
                  {it.key && <span className="rounded-full bg-night-900 px-2 py-0.5 text-[9px] tracking-[0.2em] text-gold-300 uppercase">Don’t forget</span>}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{it.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-8 rounded-2xl bg-night-900 p-5 text-sm leading-relaxed text-ivory-100/80">
        <h3 className="text-xs font-semibold tracking-[0.25em] text-gold-400 uppercase">At the door</h3>
        <ul className="mt-2 space-y-1.5">
          <li>· Check the flight time once more and leave so you reach the airport about three hours early.</li>
          <li>· Settle any debts, ask your family to forgive you, and leave your travel plan with someone at home.</li>
          <li>· {ihram ? "A ghusl before you leave is best — you will put the Ihram on at the airport." : "Travel in normal clothes; Ihram comes later, in Madinah."}</li>
        </ul>
      </section>
      <div className="mt-6">
        <DuaCard dua={LEAVING_DUA} label="Du‘a when leaving the house" />
      </div>
    </div>
  );
}

/**
 * Card for the airport beat. Each block is tall in proportion to its part of the animation, so the
 * text beside the stage always matches what the avatar is doing.
 */
export function AirportCard({ ihram, title, ends, height }: { ihram: boolean; title: string; ends: number[]; height: number }) {
  return (
    <div className="mt-4">
      <h2 className="font-display text-3xl leading-tight text-night-900 md:text-4xl">{title}</h2>
      <ol className="mt-6">
        {airportSteps(ihram).map((s, i) => (
          <li key={s.title} className="flex gap-4" style={{ minHeight: `${(ends[i] - (ends[i - 1] ?? 0)) * height * 0.9}svh` }}>
            <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-gold-500/50 font-display text-lg text-gold-600">{i + 1}</span>
            <div className="pb-8">
              <h3 className="font-display text-2xl text-night-900">{s.title}</h3>
              {s.body.map((b) => (
                <p key={b} className="mt-2 text-[15px] leading-relaxed text-ink/75">
                  {rich(b)}
                </p>
              ))}
              <ul className="mt-3 space-y-1">
                {s.tips.map((t) => (
                  <li key={t} className="flex gap-2 text-sm text-ink/60">
                    <span className="mt-2 size-1.5 shrink-0 rotate-45 bg-gold-500" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
