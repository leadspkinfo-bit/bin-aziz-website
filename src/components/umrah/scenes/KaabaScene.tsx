"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { KaabaMode, KaabaView } from "@/components/three/kaaba/KaabaCanvas";
import { haramHistoricalData, type Vec3 } from "@/lib/haramHistoricalData";
import { useLocal } from "../shared";

// the stage is short and wide on phones, so the camera starts closer there
const defaultDistance = () => (window.innerWidth < 1024 ? 20 : 29);
const ZOOM = { min: 1.6, max: 40, factor: 1.35 };
const VIEW_BUTTONS = [
  { label: "Zoom in", icon: "+", action: 1 },
  { label: "Zoom out", icon: "−", action: -1 },
  { label: "Back to overview", icon: "⟲", action: "reset" },
] as const;

/**
 * Which side to look from when walking up to a point: straight at a wall for parts of the Kaaba,
 * from the Kaaba's side for things out by the arcades (so the arcade is the backdrop), otherwise
 * from outside looking in. Always a little from above.
 */
function approach(item: (typeof haramHistoricalData)[number]): Vec3 {
  const [x, , z] = item.position;
  const r = Math.hypot(x, z) || 1;
  const [dx, dz] = item.normal ? [item.normal[0], item.normal[2]] : r > 15 ? [-x / r, -z / r] : [x / r, z / r];
  return [dx, 0.55, dz];
}

function Loading() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_50%_70%,#24305f,#0a1128_70%)]">
      <div className="flex flex-col items-center gap-3 text-ivory-100/60">
        <span className="size-8 animate-spin rounded-full border-2 border-gold-500/30 border-t-gold-400" />
        <span className="text-xs tracking-[0.25em] uppercase">Loading Masjid al-Haram</span>
      </div>
    </div>
  );
}

const KaabaCanvas = dynamic(() => import("@/components/three/kaaba/KaabaCanvas"), { ssr: false, loading: Loading });

/**
 * Phase 4: a 3D Masjid al-Haram. Drag to walk all the way round the Kaaba; pilgrims make their
 * seven rounds as you scroll. Every point in haramHistoricalData has a marker — choosing one (here or
 * in the list) walks the camera up to it. The canvas only loads once the journey gets close, and only
 * renders while this phase is on screen.
 */
export function KaabaScene({
  scene,
  active,
  focusId,
  onHotspot,
}: {
  scene: MotionValue<number>;
  active: number;
  focusId: string | null;
  onHotspot: (id: string) => void;
}) {
  const p = useLocal(scene, 3);
  const round = useTransform(p, (v): string => `${Math.min(7, Math.floor(v * 7) + 1)}`);
  const pace = useTransform(p, (v): string => (v < 3 / 7 ? "Ramal — brisk steps (men)" : "Walk at a normal pace"));
  const view = useRef<KaabaView>({ distance: 29, reset: 0, focus: null, handled: 0, enter: 0, exit: 0 });
  const [hint, setHint] = useState(true);
  const [mode, setMode] = useState<KaabaMode>("outside");
  const inside = mode === "inside";
  useEffect(() => {
    view.current.distance = defaultDistance();
  }, []);

  // walk up to whatever was chosen — from a marker in the scene or from the list beside it
  useEffect(() => {
    const item = haramHistoricalData.find((h) => h.id === focusId);
    if (!item) return;
    const inside = item.space === "inside";
    view.current.focus = { id: item.id, target: item.position, dir: approach(item), distance: item.view, inside, seq: (view.current.focus?.seq ?? 0) + 1 };
    if (!inside) view.current.distance = item.view;
  }, [focusId]);

  const zoom = (dir: 1 | -1) => {
    const v = view.current;
    v.distance = Math.min(ZOOM.max, Math.max(ZOOM.min, dir === 1 ? v.distance / ZOOM.factor : v.distance * ZOOM.factor));
  };
  const reset = () => {
    view.current.distance = defaultDistance();
    view.current.focus = null;
    view.current.reset += 1;
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-night-950" onPointerDown={() => setHint(false)} onPointerEnter={(e) => e.pointerType === "mouse" && setHint(false)}>
      {active >= 2 ? <KaabaCanvas progress={p} running={active === 3} view={view} onHotspot={onHotspot} onModeChange={setMode} /> : <Loading />}

      {/* inside the Kaaba: a quiet label and the way back out */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-[21%] flex flex-col items-center gap-1 text-center transition-opacity duration-700 md:top-[16%] ${inside ? "opacity-100" : "opacity-0"}`}
        aria-hidden={!inside}
      >
        <p className="font-arabic text-xl text-gold-300 md:text-2xl" lang="ar">
          دَاخِلَ الْكَعْبَةِ الْمُشَرَّفَة
        </p>
        <p className="text-[10px] font-semibold tracking-[0.3em] text-ivory-50 uppercase md:text-xs">Inside the Kaaba · drag to look around</p>
      </div>
      {inside && (
        <button
          type="button"
          onClick={() => (view.current.exit += 1)}
          className="absolute bottom-[4%] left-1/2 -translate-x-1/2 rounded-full border border-gold-400/60 bg-night-950/75 px-5 py-2.5 text-xs font-semibold tracking-wide text-gold-300 backdrop-blur-md transition hover:bg-gold-500 hover:text-night-950 md:text-sm"
        >
          ← Step outside
        </button>
      )}

      <div
        className={`pointer-events-none absolute top-[21%] left-[4%] rounded-2xl border border-gold-500/20 bg-night-950/60 px-4 py-3 backdrop-blur-md transition-opacity duration-500 md:top-[16%] ${mode === "outside" ? "opacity-100" : "opacity-0"}`}
      >
        <p className="text-[10px] font-semibold tracking-[0.25em] text-gold-300 uppercase">Round</p>
        <p className="font-display text-3xl leading-none text-ivory-50 tabular-nums md:text-4xl">
          <motion.span>{round}</motion.span>
          <span className="text-lg text-ivory-100/50"> / 7</span>
        </p>
        <motion.p className="mt-1 hidden text-[11px] text-ivory-100/70 md:block">{pace}</motion.p>
      </div>

      <div className={`absolute right-[4%] bottom-[4%] flex flex-col gap-1.5 transition-opacity duration-500 ${mode === "outside" ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        {VIEW_BUTTONS.map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={() => (b.action === "reset" ? reset() : zoom(b.action))}
            aria-label={b.label}
            className="grid size-9 place-items-center rounded-full border border-ivory-100/20 bg-night-950/60 text-lg leading-none text-ivory-50 backdrop-blur-md transition hover:border-gold-400 hover:text-gold-300"
          >
            {b.icon}
          </button>
        ))}
      </div>

      <p
        className={`pointer-events-none absolute bottom-[4%] left-[4%] max-w-[60%] text-[10px] leading-snug text-ivory-100/70 transition-opacity duration-500 md:text-xs ${mode === "outside" ? "opacity-100" : "opacity-0"}`}
      >
        <span className="mr-1.5 inline-block size-2 rounded-full bg-gold-400 align-middle" />
        You · tap <span className="text-gold-300">+</span> markers to explore
      </p>

      <div className={`pointer-events-none absolute inset-x-0 top-1/2 flex justify-center transition-opacity duration-700 ${hint && !focusId && mode === "outside" ? "opacity-100" : "opacity-0"}`} aria-hidden>
        <span className="inline-flex items-center gap-2 rounded-full bg-night-950/80 px-4 py-2 text-xs font-medium text-ivory-50 shadow-lg backdrop-blur">
          <svg viewBox="0 0 24 24" className="size-4 text-gold-300" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M3 12a9 9 0 0 1 15.5-6.2M21 12a9 9 0 0 1-15.5 6.2" strokeLinecap="round" />
            <path d="M18.5 2.5v3.3h-3.3M5.5 21.5v-3.3h3.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Drag to walk around the Kaaba
        </span>
      </div>
    </div>
  );
}
