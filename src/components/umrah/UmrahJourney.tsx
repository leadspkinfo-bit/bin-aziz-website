"use client";

import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useJourney } from "@/components/journey/JourneyContext";
import { StoryboardScene } from "@/components/journey/scenes/StoryboardScene";
import { haramHistoricalData } from "@/lib/haramHistoricalData";
import { AIRPORTS } from "@/lib/journey/itinerary";
import { ROZA_ID, nabawiData } from "@/lib/nabawiData";
import { saiData } from "@/lib/saiData";
import { niyyah, talbiyah } from "@/lib/umrahGuide";
import { HotspotModal } from "./HotspotModal";
import { AIRPORT_STEPS, buildBeats, transferLeg, type Beat } from "./journeyBeats";
import { HalqTaqsir } from "./phases/HalqTaqsir";
import { AirportCard, PackingCard } from "./phases/LeavingHome";
import { PackingScene } from "./scenes/PackingScene";
import { airportPoints, packingList } from "@/lib/journey/leavingHome";
import { HotelSection } from "./phases/HotelSection";
import { MiqatSection } from "./phases/MiqatSection";
import { SafaMarwah } from "./phases/SafaMarwah";
import { TawafInteractive } from "./phases/TawafInteractive";
import { TransportSection } from "./phases/TransportSection";
import { AirplaneScene } from "./scenes/AirplaneScene";
import { HalqScene } from "./scenes/HalqScene";
import { HotelScene } from "./scenes/HotelScene";
import { KaabaScene } from "./scenes/KaabaScene";
import { NabawiScene } from "./scenes/NabawiScene";
import { SafaMarwahScene } from "./scenes/SafaMarwahScene";
import { TransportScene } from "./scenes/TransportScene";
import { DuaCard, rich } from "./shared";

const AirportScene = dynamic(() => import("@/components/three/journey/AirportScene"), { ssr: false });

const CHAPTERS: Record<Beat["group"], string> = { A: "Home & arrival", B: "Makkah", C: "Madinah", D: "Second Miqat", E: "Departure" };
/** The /umrah-guide scenes each read their own slot of a 0 → 6 scale. */
const SLOT: Partial<Record<Beat["scene"], number>> = { flight: 0, transport: 1, hotel: 2, kaaba: 3, sai: 4, halq: 5 };
const FADE = 0.18; // beats of scroll a crossfade takes
const STORYBOARD = new Set<Beat["scene"]>(["arrival", "makkah", "madinah", "miqat", "departure"]);
const ALL_POINTS = [...haramHistoricalData, ...nabawiData, ...saiData];
const subscribeNothing = () => () => {};

type Shared = { spot: string | null; chamberSeq: number; onHotspot: (id: string) => void };

/** Overlay on the airport scene: the passport check and stamp happen at the immigration counter. */
export function AirportOverlay({ local, ihram }: { local: MotionValue<number>; ihram: boolean }) {
  const passport = useTransform(local, [0.17, 0.2, 0.31, 0.34], [0, 1, 1, 0]);
  const passportY = useTransform(local, [0.17, 0.2], [20, 0]);
  const stamp = useTransform(local, [0.245, 0.27], [0, 1]);
  const stampScale = useTransform(local, [0.245, 0.27], [2.2, 1]);
  const ihramTag = useTransform(local, [0.44, 0.46, 0.55, 0.57], ihram ? [0, 1, 1, 0] : [0, 0, 0, 0]);
  const seated = useTransform(local, [0.975, 0.99], [0, 1]);
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <motion.div style={{ opacity: passport, y: passportY }} className="absolute top-[24%] right-[5%] w-[min(42%,13rem)]">
        <div className="relative rounded-xl bg-[#1f3d2f] p-3 shadow-2xl ring-1 ring-gold-500/40">
          <p className="text-[9px] font-semibold tracking-[0.25em] text-gold-300">PASSPORT</p>
          <div className="mt-2 rounded-md bg-ivory-50 p-2">
            <div className="h-1.5 w-3/4 rounded bg-night-900/20" />
            <div className="mt-1.5 h-1.5 w-1/2 rounded bg-night-900/20" />
            <div className="mt-1.5 h-1.5 w-2/3 rounded bg-night-900/20" />
            <div className="h-10" />
          </div>
          <motion.div
            style={{ opacity: stamp, scale: stampScale, rotate: -12 }}
            className="absolute right-4 bottom-4 rounded-md border-[3px] border-[#b23a48] px-2 py-1 text-center text-[9px] leading-tight font-black text-[#b23a48]"
          >
            DEPARTED
            <br />
            IMMIGRATION
          </motion.div>
        </div>
        <p className="mt-2 rounded-full bg-night-950/80 px-3 py-1 text-center text-[10px] text-ivory-50">Passport checked and stamped</p>
      </motion.div>
      <motion.p style={{ opacity: ihramTag }} className="absolute top-[24%] right-[5%] rounded-full bg-night-950/80 px-3 py-1.5 text-xs text-ivory-50">
        Changing into Ihram…
      </motion.p>
      <motion.p style={{ opacity: seated }} className="absolute top-[24%] right-[5%] rounded-full bg-gold-500 px-3 py-1.5 text-xs font-semibold text-night-950">
        Seated — next stop, the Miqat
      </motion.p>
    </div>
  );
}

/** One scene on the stage: fades in around its beat and follows the scroll through it. */
function BeatLayer({ beat, t, current, shared }: { beat: Beat; t: MotionValue<number>; current: boolean; shared: Shared }) {
  const { itinerary } = useJourney();
  const opacity = useTransform(t, [beat.start - FADE, beat.start + 0.02, beat.end - 0.02, beat.end + FADE], [0, 1, 1, 0]);
  const visibility = useTransform(opacity, (o) => (o < 0.01 ? "hidden" : "visible"));
  const local = useTransform(t, (v) => Math.min(1, Math.max(0, (v - beat.start) / (beat.end - beat.start))));
  const slotted = useTransform(local, (v) => (SLOT[beat.scene] ?? 0) + v);
  const [exploring, setExploring] = useState(false);
  const p = beat.phase;
  const interactive = beat.scene === "kaaba" || beat.scene === "nabawi" || beat.scene === "sai";

  return (
    <motion.div style={{ opacity, visibility, pointerEvents: current ? "auto" : "none" }} className="absolute inset-0">
      {beat.scene === "packing" && p.kind === "home-departure" && <PackingScene progress={local} items={packingList(p.ihram).flatMap((g) => g.items)} />}
      {beat.scene === "airport" && p.kind === "home-departure" && (
        <>
          <AirportScene progress={local} ihram={p.ihram} running={current} points={airportPoints(p.ihram)} onHotspot={shared.onHotspot} />
          <AirportOverlay local={local} ihram={p.ihram} />
        </>
      )}
      {beat.scene === "flight" && p.kind === "home-departure" && <AirplaneScene scene={slotted} ihram={p.ihram} destination={AIRPORTS[itinerary.arrival].city} />}
      {beat.scene === "transport" && p.kind === "transfer" && <TransportScene scene={slotted} leg={transferLeg(p)} />}
      {beat.scene === "hotel" && <HotelScene scene={slotted} />}
      {interactive && (
        // on touch screens the 3D views only take the finger after "Explore", so the page still scrolls
        <div className={`absolute inset-0 ${exploring ? "" : "[@media(pointer:coarse)]:pointer-events-none"}`}>
          {beat.scene === "sai" ? (
            <SafaMarwahScene scene={slotted} running={current} onHotspot={shared.onHotspot} />
          ) : beat.scene === "kaaba" ? (
            <KaabaScene scene={slotted} active={current ? 3 : 2} focusId={current ? shared.spot : null} onHotspot={shared.onHotspot} />
          ) : (
            <NabawiScene running={current} chamberSeq={shared.chamberSeq} focusId={current ? shared.spot : null} onHotspot={shared.onHotspot} />
          )}
        </div>
      )}
      {interactive && (
        <button
          type="button"
          onClick={() => setExploring((e) => !e)}
          className="absolute bottom-4 left-4 z-30 hidden rounded-full border border-gold-400/60 bg-night-950/80 px-4 py-2 text-xs font-semibold text-gold-300 backdrop-blur [@media(pointer:coarse)]:block"
        >
          {exploring ? "Done exploring" : "Explore in 3D"}
        </button>
      )}
      {beat.scene === "halq" && <HalqScene scene={slotted} />}
      {STORYBOARD.has(beat.scene) && <StoryboardScene progress={local} art={beat.scene as "arrival" | "makkah" | "madinah" | "miqat" | "departure"} steps={[]} />}
    </motion.div>
  );
}

/** The right-hand text for a beat. Each card's own scroll progress drives its scene on the stage. */
function BeatCard({ beat, onProgress, children }: { beat: Beat; onProgress: (id: string, v: number) => void; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 55%", "end 55%"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => onProgress(beat.id, v));
  useEffect(() => onProgress(beat.id, scrollYProgress.get()), [beat.id, onProgress, scrollYProgress]);
  return (
    <article ref={ref} id={beat.id} style={{ minHeight: `${Math.round((beat.end - beat.start) * 55)}svh` }} className="scroll-mt-24 border-b border-night-900/10 py-10 lg:py-14">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-night-900 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-gold-300 uppercase">{CHAPTERS[beat.group]}</span>
        {beat.days && <span className="rounded-full border border-night-900/15 px-3 py-1 text-[11px] text-night-900/70 tabular-nums">{beat.days}</span>}
      </div>
      {children}
    </article>
  );
}

function Steps({ beat, spread }: { beat: Beat; spread?: boolean }) {
  return (
    <>
      <h2 className="mt-4 font-display text-3xl leading-tight text-night-900 md:text-4xl">{beat.title}</h2>
      <ol className={`mt-6 text-[15px] leading-relaxed text-ink/75 ${spread ? "flex flex-col" : "space-y-3"}`}>
        {beat.steps.map((s, i) => (
          // on the airport card each step sits level with its part of the animation
          <li key={s} className="flex gap-3" style={spread ? { minHeight: `${(AIRPORT_STEPS[i] - (AIRPORT_STEPS[i - 1] ?? 0)) * 1.6 * 100}svh` } : undefined}>
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-gold-500/50 text-[11px] font-semibold text-gold-600">{i + 1}</span>
            <span>{rich(s)}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

function NabawiCard({ beat, onHotspot }: { beat: Beat; onHotspot: (id: string) => void }) {
  return (
    <>
      <Steps beat={beat} />
      <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
        {nabawiData.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => onHotspot(h.id)}
            className="group flex items-center gap-3 rounded-2xl border border-gold-500/30 bg-ivory-100 p-3.5 text-left transition hover:-translate-y-0.5 hover:border-gold-500 hover:bg-white hover:shadow-lg"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-night-900 font-bold text-gold-400 transition group-hover:bg-gold-500 group-hover:text-night-950">+</span>
            <span className="min-w-0">
              <span className="block font-semibold text-night-900">{rich(h.name)}</span>
              <span className="block text-xs text-ink/60">{h.id === ROZA_ID ? "Seen only from above, as a simple plan" : rich(h.tagline)}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function CardBody({ beat, onHotspot }: { beat: Beat; onHotspot: (id: string) => void }) {
  const p = beat.phase;
  const firstUmrah = p.kind === "umrah" && p.number === 1;
  switch (beat.scene) {
    case "packing":
      return p.kind === "home-departure" ? <PackingCard ihram={p.ihram} /> : null;
    case "airport":
      return p.kind === "home-departure" ? <AirportCard ihram={p.ihram} title={beat.title} ends={AIRPORT_STEPS} height={(beat.end - beat.start) * 55} /> : null;
    case "flight":
      return p.kind === "home-departure" && p.ihram ? <MiqatSection /> : <Steps beat={beat} />;
    case "transport":
      return p.kind === "transfer" && p.reason === "arrival" && p.to === "makkah" ? <TransportSection /> : <Steps beat={beat} />;
    case "hotel":
      return p.kind === "makkah-arrival" && p.stay === 1 ? <HotelSection /> : <Steps beat={beat} />;
    case "kaaba":
      return firstUmrah ? <TawafInteractive onHotspot={onHotspot} /> : <Steps beat={beat} />;
    case "sai":
      return firstUmrah ? <SafaMarwah /> : <Steps beat={beat} />;
    case "halq":
      return firstUmrah ? <HalqTaqsir /> : <Steps beat={beat} />;
    case "nabawi":
      return <NabawiCard beat={beat} onHotspot={onHotspot} />;
    case "miqat":
      return (
        <>
          <Steps beat={beat} />
          <div className="mt-8 space-y-5">
            <DuaCard dua={niyyah} label="Niyyah — intention for Umrah" />
            <DuaCard dua={talbiyah} label="Talbiyah — from here until Tawaf begins" dark />
          </div>
        </>
      );
    default:
      return <Steps beat={beat} />;
  }
}

/**
 * The Umrah journey, split screen: the 3D/animated stage is pinned on the left (on top on phones) and
 * the cards scroll on the right. The cards' scroll progress, added up, is the journey position `t`
 * (in beats); it decides which scene the stage shows and how far through it is. The order of beats
 * comes from the itinerary (JourneyContext).
 */
export function UmrahJourney() {
  const { phases } = useJourney();
  const beats = useMemo(() => buildBeats(phases), [phases]);
  const t = useMotionValue(0);
  const progress = useRef(new Map<string, number>());
  const report = useCallback(
    (id: string, v: number) => {
      progress.current.set(id, v);
      let sum = 0;
      for (const b of beats) sum += (progress.current.get(b.id) ?? 0) * (b.end - b.start);
      t.set(sum);
    },
    [beats, t],
  );

  const [active, setActive] = useState(0);
  useMotionValueEvent(t, "change", (v) => {
    const i = beats.findIndex((b) => v < b.end);
    setActive(i < 0 ? beats.length - 1 : i);
  });
  const current = beats[Math.min(active, beats.length - 1)];
  const bar = useTransform(t, (v) => v / beats[beats.length - 1].end);

  const [spot, setSpot] = useState<string | null>(null);
  const [chamberSeq, setChamberSeq] = useState(0);
  // the sacred chamber never opens a card: it switches the Madinah view to its top-down plan
  const onHotspot = useCallback((id: string) => (id === ROZA_ID ? setChamberSeq((n) => n + 1) : setSpot(id)), []);
  const close = useCallback(() => setSpot(null), []);
  const start = phases[0];
  const card = [...ALL_POINTS, ...airportPoints(start.kind === "home-departure" && start.ihram)].find((h) => h.id === spot);
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const shared: Shared = { spot, chamberSeq, onHotspot };

  const chapters = beats.reduce<Beat[]>((list, b) => (list.at(-1)?.group === b.group ? list : [...list, b]), []);

  return (
    <section className="bg-ivory-50" aria-label="Your Umrah journey">
      <div className="container-page lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 xl:gap-16">
        {/* stage */}
        <div className="sticky top-16 z-20 -mx-5 bg-ivory-50 px-5 pt-3 pb-3 md:-mx-8 md:px-8 lg:top-0 lg:mx-0 lg:h-svh lg:self-start lg:px-0 lg:pt-24 lg:pb-8">
          <div className="relative h-[42svh] overflow-hidden rounded-[1.75rem] bg-night-950 shadow-[0_30px_60px_-30px_rgb(10_17_40/0.6)] ring-1 ring-gold-500/20 lg:h-full lg:rounded-[2.25rem]">
            {beats.map((b, i) => (Math.abs(i - active) <= 1 ? <BeatLayer key={b.id} beat={b} t={t} current={i === active} shared={shared} /> : null))}

            <nav aria-label="Journey chapters" className="absolute inset-x-3 top-3 z-30 md:inset-x-4 md:top-4">
              <ol className="flex gap-1 overflow-x-auto rounded-full bg-night-950/60 p-1 backdrop-blur-md [scrollbar-width:none]">
                {chapters.map((c, i) => {
                  const next = chapters[i + 1]?.start ?? Infinity;
                  const on = current.start >= c.start && current.start < next;
                  return (
                    <li key={c.id} className="flex-1">
                      <button
                        type="button"
                        onClick={() => document.getElementById(c.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className={`w-full rounded-full px-2.5 py-1.5 text-[10px] font-semibold whitespace-nowrap transition md:text-xs ${on ? "bg-gold-500 text-night-950" : "text-ivory-100/60 hover:text-ivory-50"}`}
                      >
                        {CHAPTERS[c.group]}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="mx-3 mt-1.5 h-0.5 overflow-hidden rounded-full bg-ivory-50/10">
                <motion.div style={{ scaleX: bar }} className="h-full origin-left bg-gold-400" />
              </div>
            </nav>
          </div>
        </div>

        {/* cards; the space at the end keeps the stage pinned for the farewell */}
        <div className="pb-[55svh]">
          {beats.map((b) => (
            <BeatCard key={b.id} beat={b} onProgress={report}>
              <CardBody beat={b} onHotspot={onHotspot} />
            </BeatCard>
          ))}
        </div>
      </div>

      {hydrated && createPortal(<AnimatePresence>{card && <HotspotModal key={card.id} spot={card} onClose={close} />}</AnimatePresence>, document.body)}
    </section>
  );
}
