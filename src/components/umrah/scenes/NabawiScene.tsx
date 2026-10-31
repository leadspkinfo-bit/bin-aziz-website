"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { NABAWI_DISTANCE, VANTAGES, type NabawiControl, type NabawiMode, type VantageId } from "@/components/three/nabawi/NabawiCanvas";
import { ROZA_ID } from "@/lib/nabawiData";
import { rich } from "../shared";

const NabawiCanvas = dynamic(() => import("@/components/three/nabawi/NabawiCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-night-950 text-xs tracking-[0.25em] text-ivory-100/60 uppercase">Loading Masjid an-Nabawi</div>
  ),
});

const ZOOM = { min: 45, max: 320, factor: 1.3 };

/**
 * Plain top-down plan of the sacred chamber: three respectful markers and nothing else. Positions
 * are schematic, after the description narrated from al-Qasim ibn Muhammad: the Prophet ﷺ nearest
 * the Qibla, Abu Bakr (RA) behind him with his head at the Prophet’s ﷺ shoulders, and ‘Umar (RA)
 * behind Abu Bakr in the same way.
 */
function ChamberPlan({ onBack }: { onBack: () => void }) {
  const graves = [
    { name: "Prophet Muhammad ﷺ", x: 40, y: 70 },
    { name: "Hazrat Abu Bakr (RA)", x: 54, y: 50 },
    { name: "Hazrat ‘Umar (RA)", x: 68, y: 30 },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-ivory-50/95 p-6 text-night-900 backdrop-blur-sm"
      role="dialog"
      aria-label="Plan of the sacred chamber"
    >
      <p className="text-[10px] font-semibold tracking-[0.3em] text-gold-600 uppercase">Seen from above</p>
      <p className="mt-1 font-arabic text-xl text-gold-600" lang="ar">
        الْحُجْرَةُ النَّبَوِيَّةُ الشَّرِيفَة
      </p>
      <div className="relative mt-4 aspect-[4/5] w-[min(70%,18rem)] rounded-md border-2 border-night-900/40">
        {graves.map((g) => (
          <div key={g.name} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${g.x}%`, top: `${g.y}%` }}>
            <span className="size-3.5 rounded-full border-2 border-gold-600 bg-ivory-50" aria-hidden />
            <span className="mt-1 text-[11px] font-semibold whitespace-nowrap md:text-xs">{rich(g.name)}</span>
          </div>
        ))}
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.2em] whitespace-nowrap text-night-900/60 uppercase">↓ Qibla (south)</span>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="mt-12 rounded-full bg-night-900 px-6 py-2.5 text-sm font-semibold text-gold-300 transition hover:bg-gold-500 hover:text-night-950"
        autoFocus
      >
        ← Back
      </button>
    </motion.div>
  );
}

/**
 * Phase C: Masjid an-Nabawi in 3D. Outside: rotate, zoom, open a gate to fly in. Inside: look around
 * and walk between fixed places — never into the sacred chamber. `chamberSeq` goes up each time the
 * chamber is chosen; the view then rises above it and only the plain plan is shown until "Back".
 */
export function NabawiScene({
  running,
  chamberSeq,
  focusId,
  onHotspot,
}: {
  running: boolean;
  chamberSeq: number;
  focusId: string | null;
  onHotspot: (id: string) => void;
}) {
  const [closedAt, setClosedAt] = useState(0);
  const [topDown, setTopDown] = useState(false);
  const [mode, setMode] = useState<NabawiMode>("outside");
  const chamber = chamberSeq > closedAt;
  const zoom = useRef(NABAWI_DISTANCE);
  const control = useRef<NabawiControl>({ enter: 0, gate: "west", exit: 0, walk: null });
  const onTopDown = useCallback((v: boolean) => setTopDown(v), []);
  const back = () => {
    setTopDown(false);
    setClosedAt(chamberSeq);
  };
  const walk = (to: VantageId) => {
    control.current.walk = { to, seq: (control.current.walk?.seq ?? 0) + 1 };
  };
  const outside = mode === "outside" && !chamber;

  return (
    <div className="absolute inset-0 overflow-hidden bg-night-950">
      <NabawiCanvas
        running={running}
        chamber={chamber}
        zoom={zoom}
        control={control}
        focusId={focusId}
        onHotspot={onHotspot}
        onTopDown={onTopDown}
        onModeChange={setMode}
      />

      {/* outside: zoom */}
      <div className={`absolute right-[4%] bottom-[4%] z-20 flex flex-col gap-1.5 transition-opacity ${outside ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        {[
          { label: "Zoom in", icon: "+", f: 1 / ZOOM.factor },
          { label: "Zoom out", icon: "−", f: ZOOM.factor },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            aria-label={b.label}
            onClick={() => (zoom.current = Math.min(ZOOM.max, Math.max(ZOOM.min, zoom.current * b.f)))}
            className="grid size-9 place-items-center rounded-full border border-ivory-100/20 bg-night-950/60 text-lg leading-none text-ivory-50 backdrop-blur-md transition hover:border-gold-400 hover:text-gold-300"
          >
            {b.icon}
          </button>
        ))}
      </div>

      {/* inside: where to stand, and the way out */}
      <AnimatePresence>
        {mode === "inside" && !chamber && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-20">
            <div className="absolute inset-x-0 top-[17%] text-center md:top-[14%]">
              <p className="font-arabic text-lg text-gold-300 md:text-xl" lang="ar">
                الْمَسْجِدُ النَّبَوِيُّ الشَّرِيف
              </p>
              <p className="text-[10px] font-semibold tracking-[0.3em] text-ivory-50 uppercase md:text-xs">Inside · drag to look around</p>
            </div>
            <div className="pointer-events-auto absolute inset-x-3 bottom-14 flex flex-wrap justify-center gap-1.5">
              {(Object.keys(VANTAGES) as VantageId[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => walk(v)}
                  className="rounded-full border border-gold-400/40 bg-night-950/75 px-3 py-1.5 text-[11px] font-semibold text-ivory-50 backdrop-blur transition hover:bg-gold-500 hover:text-night-950"
                >
                  {VANTAGES[v].label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => (control.current.exit += 1)}
              className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-gold-400/60 bg-night-950/80 px-5 py-2 text-xs font-semibold text-gold-300 backdrop-blur transition hover:bg-gold-500 hover:text-night-950"
            >
              ← Step outside
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{chamber && topDown && <ChamberPlan onBack={back} />}</AnimatePresence>
    </div>
  );
}

export { ROZA_ID };
