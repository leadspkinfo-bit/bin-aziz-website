"use client";

import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { StoryboardScene } from "@/components/journey/scenes/StoryboardScene";
import type { HajjBeat } from "@/components/three/hajj/HajjCanvas";
import { HotspotModal } from "@/components/umrah/HotspotModal";
import { AirplaneScene } from "@/components/umrah/scenes/AirplaneScene";
import { HotelScene } from "@/components/umrah/scenes/HotelScene";
import { KaabaScene } from "@/components/umrah/scenes/KaabaScene";
import { NabawiScene } from "@/components/umrah/scenes/NabawiScene";
import { PackingScene } from "@/components/umrah/scenes/PackingScene";
import { TransportScene, type TransportRoute } from "@/components/umrah/scenes/TransportScene";
import { Callout, Checklist, DuaCard, Numbered, rich } from "@/components/umrah/shared";
import { AirportOverlay } from "@/components/umrah/UmrahJourney";
import { hajjStep } from "@/lib/hajj/hajjData";
import { hajjPointCard, type HajjStage } from "@/lib/hajj/hajjPoints";
import type { HajjPhase } from "@/lib/hajj/itinerary";
import { haramHistoricalData } from "@/lib/haramHistoricalData";
import { airportPoints, packingList } from "@/lib/journey/leavingHome";
import { ROZA_ID, nabawiData } from "@/lib/nabawiData";
import { useHajj } from "./HajjContext";

const HajjCanvas = dynamic(() => import("@/components/three/hajj/HajjCanvas"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center bg-night-950 text-xs tracking-[0.25em] text-ivory-100/60 uppercase">Loading the Hajj</div>,
});
const AirportScene = dynamic(() => import("@/components/three/journey/AirportScene"), { ssr: false });

/** Steps shown in the shared 3D Hajj canvas. Everything else is its own layer on the stage. */
const STAGE_OF: Partial<Record<HajjPhase["step"], HajjStage>> = {
  "day-8-mina": "mina",
  "day-9-arafat": "arafat",
  "day-9-muzdalifah": "muzdalifah",
  "day-10-rami": "jamarat",
  "day-10-qurbani": "qurbani",
  "day-10-halq": "mina",
  "day-11-tashreeq": "jamarat",
  "day-12-tashreeq": "jamarat",
  "day-13-tashreeq": "jamarat",
};
const LEGS: Partial<Record<HajjPhase["step"], TransportRoute>> = {
  "transfer-to-makkah": { from: "Jeddah", fromNote: "King Abdulaziz Airport", to: "Makkah", km: 90, landing: false },
  "miqat-dhul-hulayfah": { from: "Madinah", fromNote: "MED · your hotel", to: "Makkah", km: 450, landing: false, startHotel: true, stop: { at: 0.2, name: "Masjid Dhul Hulayfah", note: "Abyar ‘Ali · Miqat: Ihram & Niyyah" } },
  "road-to-mina": { from: "Makkah", fromNote: "Your hotel · in Ihram", to: "Mina", km: 8, landing: false, startHotel: true },
};
const IHRAM_STEPS = ["Ghusl", "Ihram", "Two rak‘ahs", "Niyyah for Hajj", "Talbiyah"];
const STATUS = { rukn: "Rukn · Hajj depends on it", wajib: "Wajib", sunnah: "Sunnah" };
const FADE = 0.18;
const subscribeNothing = () => () => {};

type Shared = { spot: string | null; chamberSeq: number; ihram: boolean; onPoint: (id: string) => void };

/** Getting ready at the hotel: the steps of entering Ihram light up over the Makkah skyline. */
function IhramOverlay({ local }: { local: MotionValue<number> }) {
  return (
    <ol className="pointer-events-none absolute inset-x-[5%] bottom-[6%] z-20 flex flex-wrap justify-center gap-1.5">
      {IHRAM_STEPS.map((s, i) => (
        <IhramChip key={s} local={local} at={0.1 + i * 0.16} label={s} />
      ))}
    </ol>
  );
}

function IhramChip({ local, at, label }: { local: MotionValue<number>; at: number; label: string }) {
  const opacity = useTransform(local, [at, at + 0.08], [0.3, 1]);
  return (
    <motion.li style={{ opacity }} className="rounded-full border border-gold-400/50 bg-night-950/75 px-3 py-1.5 text-xs font-semibold text-ivory-50 backdrop-blur">
      {label}
    </motion.li>
  );
}

/** The greeting that opens the 10th: Eid al-Adha falls in the middle of Hajj. */
function EidGreeting({ t, at }: { t: MotionValue<number>; at: number }) {
  const opacity = useTransform(t, [at - 0.12, at + 0.02, at + 0.3, at + 0.46], [0, 1, 1, 0]);
  const y = useTransform(t, [at - 0.12, at + 0.02], [18, 0]);
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? "hidden" : "visible"));
  return (
    <motion.div style={{ opacity, y, visibility }} className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-night-950/85 text-center text-ivory-50 backdrop-blur-[2px]">
      <div className="px-6">
        <p className="font-arabic text-3xl text-gold-300 md:text-5xl" lang="ar" dir="rtl">
          عِيدٌ مُبَارَك
        </p>
        <p className="mt-2 font-display text-5xl md:text-7xl">
          Eid <span className="text-gold-gradient italic">Mubarak</span>
        </p>
        <p className="mt-3 text-xs font-semibold tracking-[0.3em] text-ivory-100/85 uppercase md:text-sm">10 Dhul Hijjah · The Day of Sacrifice</p>
        <p className="mt-2 font-arabic text-xl text-gold-300" lang="ar" dir="rtl">
          تَقَبَّلَ اللّٰهُ مِنَّا وَمِنْكُمْ
        </p>
      </div>
    </motion.div>
  );
}

/** A scene that isn't part of the Hajj canvas, laid over it for the length of its card. */
function Layer({ phase, beat, t, current, shared }: { phase: HajjPhase; beat: { start: number; end: number }; t: MotionValue<number>; current: boolean; shared: Shared }) {
  const { itinerary } = useHajj();
  const opacity = useTransform(t, [beat.start - FADE, beat.start + 0.02, beat.end - 0.02, beat.end + FADE], [0, 1, 1, 0]);
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? "hidden" : "visible"));
  const local = useTransform(t, (v) => Math.min(1, Math.max(0, v - beat.start)));
  const at = (slot: number) => (v: number) => slot + v;
  const flight = useTransform(local, at(0));
  const road = useTransform(local, at(1));
  const hotel = useTransform(local, at(2));
  const kaaba = useTransform(local, at(3));
  const step = phase.step;
  const leg = LEGS[step];

  return (
    <motion.div style={{ opacity, visibility, pointerEvents: current ? "auto" : "none" }} className="absolute inset-0 z-10 bg-night-950">
      {step === "leaving-home" && <PackingScene progress={local} items={packingList(shared.ihram).flatMap((g) => g.items.map((i) => ({ ...i, label: i.label.replace("Umrah visa", "Hajj visa") })))} />}
      {step === "home-airport" && (
        <>
          <AirportScene progress={local} ihram={shared.ihram} running={current} points={airportPoints(shared.ihram)} onHotspot={shared.onPoint} />
          <AirportOverlay local={local} ihram={shared.ihram} />
        </>
      )}
      {step === "flight" && <AirplaneScene scene={flight} ihram={shared.ihram} destination={itinerary.arrival === "JED" ? "Jeddah" : "Madinah"} />}
      {step === "arrival" && <StoryboardScene progress={local} art="arrival" steps={[]} />}
      {leg && <TransportScene scene={road} leg={leg} />}
      {(step === "makkah-hotel" || step === "ihram-at-hotel") && <HotelScene scene={hotel} showSteps={step === "makkah-hotel"} />}
      {step === "ihram-at-hotel" && <IhramOverlay local={local} />}
      {step === "waiting-in-makkah" && <StoryboardScene progress={local} art="makkah" steps={[]} />}
      {(step === "first-umrah" || step === "day-10-ziyarah" || step === "tawaf-wida") && <KaabaScene scene={kaaba} active={current ? 3 : 2} focusId={current ? shared.spot : null} onHotspot={shared.onPoint} />}
      {step === "madinah" && <NabawiScene running={current} chamberSeq={shared.chamberSeq} focusId={current ? shared.spot : null} onHotspot={shared.onPoint} />}
      {step === "departure" && <StoryboardScene progress={local} art="departure" rite="Hajj" steps={[]} />}
    </motion.div>
  );
}

function StepCard({ phase, onProgress }: { phase: HajjPhase; onProgress: (id: string, v: number) => void }) {
  const s = hajjStep(phase.step);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 55%", "end 55%"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => onProgress(phase.id, v));
  useEffect(() => onProgress(phase.id, scrollYProgress.get()), [onProgress, phase.id, scrollYProgress]);

  return (
    <article ref={ref} className="min-h-[70svh] scroll-mt-24 space-y-6 border-b border-night-900/10 py-10 text-[15px] leading-relaxed text-ink/75 lg:py-14">
      <div className="flex flex-wrap items-center gap-2">
        {phase.when && <span className="rounded-full bg-night-900 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-gold-300 uppercase">{phase.when}</span>}
        {s.status && <span className="rounded-full border border-gold-500/40 px-3 py-1 text-[11px] text-gold-600">{STATUS[s.status]}</span>}
      </div>
      <div>
        <h2 className="font-display text-3xl leading-tight text-night-900 md:text-4xl">{s.title}</h2>
        {s.arabic && (
          <p className="mt-2 font-arabic text-2xl text-gold-600" lang="ar" dir="rtl">
            {s.arabic}
          </p>
        )}
        <p className="mt-3">{rich(s.summary)}</p>
      </div>
      <Numbered items={s.steps} />
      {s.rules && (
        <div>
          <h3 className="font-display text-2xl text-night-900">Rulings to remember</h3>
          <div className="mt-3">
            <Checklist items={s.rules} />
          </div>
        </div>
      )}
      {s.women && (
        <Callout title="For women" tone="green">
          {s.women.map((w) => rich(w))}
        </Callout>
      )}
      {s.avoid && (
        <div>
          <h3 className="font-display text-2xl text-night-900">Avoid</h3>
          <div className="mt-3">
            <Checklist items={s.avoid} tone="rose" />
          </div>
        </div>
      )}
      {s.note && <Callout title="Where opinions differ">{rich(s.note)}</Callout>}
      {s.duas?.map((d, i) => <DuaCard key={d.label} dua={d.dua} label={d.label} dark={i % 2 === 1} />)}
      {s.evidence && (
        <ul className="space-y-3">
          {s.evidence.map((e) => (
            <li key={e.text} className="rounded-2xl border border-gold-500/20 bg-white p-4">
              <p className="text-night-900">{rich(e.text)}</p>
              <p className="mt-1 text-xs font-semibold tracking-wide text-gold-600">— {e.source}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/**
 * The whole Hajj, split screen like the Umrah guide: the stage is pinned on the left (on top on
 * phones) and each card's scroll moves the journey on. The days at Mina, Arafat, Muzdalifah and the
 * Jamarat share one 3D canvas; the other steps are layers over it.
 */
export function HajjJourney() {
  const { phases, pebbles, itinerary } = useHajj();
  // non-canvas steps rest the canvas on Mina, hidden under their layer
  const beats = useMemo<HajjBeat[]>(() => phases.map((p, i) => ({ stage: STAGE_OF[p.step] ?? "mina", start: i, end: i + 1 })), [phases]);
  const t = useMotionValue(0);
  const progress = useRef(new Map<string, number>());
  const report = useCallback(
    (id: string, v: number) => {
      progress.current.set(id, v);
      let sum = 0;
      for (const p of phases) sum += progress.current.get(p.id) ?? 0;
      t.set(sum);
    },
    [phases, t],
  );
  const [active, setActive] = useState(0);
  useMotionValueEvent(t, "change", (v) => setActive(Math.min(phases.length - 1, Math.floor(v))));
  const currentPhase = phases[Math.min(active, phases.length - 1)];
  const inCanvas = !!STAGE_OF[currentPhase.step];
  const eidAt = phases.findIndex((p) => p.step === "day-10-rami");

  const stage = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [exploring, setExploring] = useState(false);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [point, setPoint] = useState<string | null>(null);
  const [chamberSeq, setChamberSeq] = useState(0);
  const onPoint = useCallback((id: string) => (id === ROZA_ID ? setChamberSeq((n) => n + 1) : setPoint(id)), []);
  const close = useCallback(() => setPoint(null), []);
  const ihram = itinerary.arrival === "JED";
  const list = useMemo(() => [...haramHistoricalData, ...nabawiData, ...airportPoints(ihram)], [ihram]);
  const card = point ? (hajjPointCard(point, pebbles) ?? list.find((h) => h.id === point)) : undefined;
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const shared: Shared = { spot: point, chamberSeq, ihram, onPoint };

  return (
    <section className="bg-ivory-50" aria-label="Your Hajj journey">
      <div className="container-page lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
        <div className="sticky top-16 z-20 -mx-5 bg-ivory-50 px-5 pt-3 pb-3 md:-mx-8 md:px-8 lg:top-0 lg:mx-0 lg:h-svh lg:self-start lg:px-0 lg:pt-24 lg:pb-8">
          <div ref={stage} className="relative h-[42svh] overflow-hidden rounded-[1.75rem] bg-night-950 shadow-[0_30px_60px_-30px_rgb(10_17_40/0.6)] ring-1 ring-gold-500/20 lg:h-full lg:rounded-[2.25rem]">
            {/* on touch screens the 3D views only take the finger after "Explore", so the page still scrolls */}
            <div className={`absolute inset-0 ${exploring ? "" : "[@media(pointer:coarse)]:pointer-events-none"}`}>
              <HajjCanvas t={t} beats={beats} running={visible && inCanvas} open={!!card} onPoint={onPoint} />
              <EidGreeting t={t} at={eidAt} />
              {phases.map((p, i) =>
                !STAGE_OF[p.step] && Math.abs(i - active) <= 1 ? <Layer key={p.id} phase={p} beat={{ start: i, end: i + 1 }} t={t} current={i === active} shared={shared} /> : null,
              )}
            </div>
            <button
              type="button"
              onClick={() => setExploring((e) => !e)}
              className="absolute bottom-4 left-4 z-30 hidden rounded-full border border-gold-400/60 bg-night-950/80 px-4 py-2 text-xs font-semibold text-gold-300 backdrop-blur [@media(pointer:coarse)]:block"
            >
              {exploring ? "Done exploring" : "Explore in 3D"}
            </button>
          </div>
        </div>
        <div className="pb-[55svh]">
          {phases.map((p) => (
            <StepCard key={p.id} phase={p} onProgress={report} />
          ))}
        </div>
      </div>
      {hydrated && createPortal(<AnimatePresence>{card && <HotspotModal key={card.id} spot={card} onClose={close} />}</AnimatePresence>, document.body)}
    </section>
  );
}
