"use client";

import { useId } from "react";
import { dhulHijjah } from "@/lib/hajj/itinerary";
import type { Airport } from "@/lib/journey/itinerary";
import { useHajj } from "./HajjContext";

function Stepper({ field, label, hint, unit }: { field: "daysBefore" | "packageDays"; label: string; hint: string; unit: string }) {
  const { input, issues, set } = useHajj();
  const id = useId();
  const error = issues.find((i) => i.field === field)?.message;
  const value = input[field];
  const change = (n: number) => set(field, Math.min(90, Math.max(0, n)));
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-[11px] font-semibold tracking-[0.25em] text-gold-300 uppercase">
        {label}
      </label>
      <div className="mt-2 flex items-stretch overflow-hidden rounded-2xl border border-ivory-100/15 bg-night-900 transition focus-within:border-gold-400">
        <button type="button" onClick={() => change(value - 1)} aria-label={`Less: ${label}`} className="px-4 text-lg text-gold-300 transition hover:bg-ivory-50/5">
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={90}
          value={value}
          onChange={(e) => change(e.target.value === "" ? 0 : Number(e.target.value))}
          className="w-full min-w-0 bg-transparent py-3 text-center text-sm text-ivory-50 tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="self-center pr-1 text-xs text-ivory-100/50">{unit}</span>
        <button type="button" onClick={() => change(value + 1)} aria-label={`More: ${label}`} className="px-4 text-lg text-gold-300 transition hover:bg-ivory-50/5">
          +
        </button>
      </div>
      <p className={`mt-1.5 text-xs ${error ? "text-rose-300" : "text-ivory-100/50"}`}>{error ?? hint}</p>
    </div>
  );
}

/** "Plan the Hajj Journey": three answers, and the engine works out the rest. */
export function HajjPanel() {
  const { input, itinerary, plan, route, set, reset } = useHajj();
  const airport = useId();
  const parts = [
    plan.madinahFirst ? `${plan.madinahDays} in Madinah` : null,
    `${plan.makkahBefore} in Makkah`,
    `${plan.coreDays} of Hajj`,
    plan.makkahAfter > 0 ? `${plan.makkahAfter} more in Makkah` : null,
    !plan.madinahFirst && plan.madinahDays > 0 ? `${plan.madinahDays} in Madinah` : null,
  ].filter(Boolean);

  return (
    <section aria-labelledby="hajj-planner" className="relative overflow-hidden rounded-[2rem] bg-night-950 p-6 text-ivory-50 shadow-[0_40px_80px_-40px_rgb(10_17_40/0.7)] ring-1 ring-gold-500/20 md:p-10">
      <div className="bg-islamic-pattern absolute inset-0 opacity-70" aria-hidden />
      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">Your itinerary</p>
            <h2 id="hajj-planner" className="mt-2 font-display text-3xl md:text-4xl">
              Plan the Hajj journey, <span className="text-gold-gradient italic">we work out the rest.</span>
            </h2>
          </div>
          <button type="button" onClick={reset} className="rounded-full border border-ivory-100/20 px-4 py-2 text-xs text-ivory-100/70 transition hover:border-gold-400 hover:text-gold-300">
            Reset
          </button>
        </div>

        <form className="mt-8 grid gap-5 md:grid-cols-3" onSubmit={(e) => e.preventDefault()}>
          <Stepper field="daysBefore" label="Arrival · days before Mina" unit="days" hint={`You arrive on ${dhulHijjah(8 - itinerary.daysBefore)}`} />
          <Stepper field="packageDays" label="Package duration" unit="days" hint="Your whole stay in Saudi Arabia" />
          <div className="min-w-0">
            <label htmlFor={airport} className="text-[11px] font-semibold tracking-[0.25em] text-gold-300 uppercase">
              Arrival airport
            </label>
            <select
              id={airport}
              value={input.arrival}
              onChange={(e) => set("arrival", e.target.value as Airport)}
              className="mt-2 w-full rounded-2xl border border-ivory-100/15 bg-night-900 px-4 py-3 text-sm text-ivory-50 outline-none transition focus:border-gold-400"
            >
              <option value="JED">Jeddah (JED)</option>
              <option value="MED">Madinah (MED)</option>
            </select>
          </div>
        </form>

        <div className="mt-8 border-t border-ivory-100/10 pt-6">
          <p className="font-display text-xl md:text-2xl">{route}</p>
          <p className="mt-1 text-sm text-ivory-100/60">
            {parts.join(" · ")} · flying home from {plan.departure === "JED" ? "Jeddah" : "Madinah"}
          </p>
        </div>
      </div>
    </section>
  );
}
