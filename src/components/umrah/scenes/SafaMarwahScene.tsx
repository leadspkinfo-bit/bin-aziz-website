"use client";

import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useLocal } from "../shared";

const SaiCanvas = dynamic(() => import("@/components/three/sai/SaiCanvas"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center bg-night-950 text-xs tracking-[0.25em] text-ivory-100/60 uppercase">Loading Safa &amp; Marwah</div>,
});

const legOf = (v: number) => Math.floor(Math.min(v, 0.9999) * 7);

/** Sa’i in 3D: scrolling walks you through the seven rounds; drag to look around; + opens the details. */
export function SafaMarwahScene({ scene, running, onHotspot }: { scene: MotionValue<number>; running: boolean; onHotspot: (id: string) => void }) {
  const p = useLocal(scene, 4);
  const round = useTransform(p, (v): string => `${legOf(v) + 1}`);
  const direction = useTransform(p, (v): string => (legOf(v) % 2 === 0 ? "Safa → Marwah" : "Marwah → Safa"));
  const [jogging, setJogging] = useState(false);
  useMotionValueEvent(p, "change", (v) => {
    const legs = Math.min(v, 0.9999) * 7;
    const t = legs - Math.floor(legs);
    setJogging(t > 0.42 && t < 0.58); // the green-light stretch, halfway along each leg
  });

  return (
    <div className="absolute inset-0 overflow-hidden bg-night-950">
      <SaiCanvas progress={p} running={running} onHotspot={onHotspot} />
      <div className="pointer-events-none absolute top-[17%] left-[4%] rounded-2xl border border-gold-500/20 bg-night-950/60 px-4 py-2.5 backdrop-blur-md md:top-[14%]">
        <p className="text-[10px] font-semibold tracking-[0.25em] text-gold-300 uppercase">
          Round <motion.span className="tabular-nums">{round}</motion.span> / 7
        </p>
        <motion.p className="mt-0.5 text-xs whitespace-nowrap text-ivory-50 md:text-sm">{direction}</motion.p>
      </div>
      <p
        className={`pointer-events-none absolute top-[17%] right-[4%] rounded-full border border-emerald-400/60 bg-night-950/75 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 transition-opacity duration-300 md:top-[14%] ${jogging ? "opacity-100" : "opacity-0"}`}
      >
        Green lights · men jog here
      </p>
    </div>
  );
}
