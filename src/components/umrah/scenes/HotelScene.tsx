"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { hotel } from "@/lib/umrahGuide";
import { useLocal } from "../shared";

const COLS = 6;
const ROWS = 9;

function Window({ p, order }: { p: MotionValue<number>; order: number }) {
  // windows switch on one after another as the guest settles in
  const start = 0.12 + (order / (COLS * ROWS)) * 0.55;
  const opacity = useTransform(p, [start, start + 0.06], [0.12, 1]);
  return <motion.span style={{ opacity }} className="rounded-[2px] bg-gold-300 shadow-[0_0_6px_#ecd9a8]" />;
}

function StepChip({ p, i, title }: { p: MotionValue<number>; i: number; title: string }) {
  const n = hotel.steps.length;
  const opacity = useTransform(p, [(i - 0.6) / n, i / n, (i + 1) / n, (i + 1.4) / n], [0.25, 1, 1, i === n - 1 ? 1 : 0.35]);
  const x = useTransform(p, [(i - 0.6) / n, i / n], [12, 0]);
  return (
    <motion.li style={{ opacity, x }} className="flex items-center gap-2.5">
      <span className="grid size-5 shrink-0 place-items-center rounded-full border border-gold-400/60 text-[9px] font-semibold text-gold-300 tabular-nums">
        {i + 1}
      </span>
      <span className="text-[11px] leading-tight text-ivory-50 md:text-sm">{title}</span>
    </motion.li>
  );
}

/** Phase 3: the hotel rises against the Makkah skyline; its windows light up. */
export function HotelScene({ scene, showSteps = true }: { scene: MotionValue<number>; showSteps?: boolean }) {
  const p = useLocal(scene, 2);
  const enter = useTransform(scene, [1.82, 2.15], [0, 1]);
  const rise = useTransform(enter, [0, 1], ["45%", "0%"]);
  const towerRise = useTransform(enter, [0, 1], ["25%", "0%"]);
  const sky = useTransform(p, [0, 1], [0, 1]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#1b2550] via-night-800 to-night-950">
      <motion.div style={{ opacity: sky }} className="absolute inset-0 bg-gradient-to-b from-[#3a3360]/60 via-transparent to-transparent" />
      <div className="absolute top-[10%] right-[14%] hidden size-14 rounded-full bg-ivory-50 shadow-[0_0_40px_#fbf8f1] md:block">
        <span className="absolute top-0 right-0 size-11 translate-x-2 -translate-y-1 rounded-full bg-[#1b2550]" />
      </div>


      {/* skyline with the clock tower */}
      <motion.svg style={{ y: towerRise }} viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[78%] w-full" aria-hidden>
        <g fill="#0d1532">
          <rect x="0" y="150" width="40" height="70" />
          <rect x="34" y="128" width="30" height="92" />
          <rect x="60" y="160" width="36" height="60" />
          <rect x="300" y="140" width="34" height="80" />
          <rect x="330" y="118" width="28" height="102" />
          <rect x="356" y="152" width="44" height="68" />
          {/* clock tower */}
          <rect x="248" y="86" width="44" height="134" />
          <rect x="256" y="40" width="28" height="50" />
          <path d="M256 40 L270 14 L284 40 Z" />
          <rect x="268.5" y="0" width="3" height="16" />
        </g>
        <circle cx="270" cy="62" r="10" fill="#dcc08a" opacity="0.9" />
        <circle cx="270" cy="62" r="7" fill="none" stroke="#0d1532" strokeWidth="1" />
        <path d="M270 62 L270 56 M270 62 L274 64" stroke="#0d1532" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M264 0 Q270 -4 276 0" fill="none" stroke="#dcc08a" strokeWidth="1.2" />
      </motion.svg>

      {/* the hotel */}
      <motion.div style={{ y: rise }} className="absolute bottom-0 left-[10%] flex h-[70%] w-[34%] flex-col md:left-[12%]">
        <div className="mx-auto h-3 w-[70%] rounded-t-md bg-[#25336b]" />
        <div className="relative flex-1 rounded-t-lg border border-gold-500/25 bg-gradient-to-b from-[#25336b] to-[#141d42] px-[9%] pt-[22%]">
          <p className="absolute inset-x-0 top-[6%] text-center text-[8px] font-semibold tracking-[0.3em] text-gold-300 md:text-[10px]">HOTEL ★★★★★</p>
          <div className="grid h-[72%] gap-[7%_14%]" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
            {Array.from({ length: COLS * ROWS }, (_, k) => (
              <Window key={k} p={p} order={(k * 7) % (COLS * ROWS)} />
            ))}
          </div>
          <div className="absolute bottom-0 left-1/2 h-[14%] w-[30%] -translate-x-1/2 rounded-t-md bg-gold-400/80 shadow-[0_0_20px_#c9a35b]" />
        </div>
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 h-[6%] bg-night-950" />

      {showSteps && (
      <ol className="absolute top-[21%] right-[4%] w-[50%] space-y-2 rounded-2xl border border-gold-500/15 bg-night-950/55 p-3 backdrop-blur-md md:top-[28%] md:w-[46%] md:space-y-3 md:p-5">
        {hotel.steps.map((s, i) => (
          <StepChip key={s.title} p={p} i={i} title={s.title} />
        ))}
      </ol>
      )}
    </div>
  );
}
