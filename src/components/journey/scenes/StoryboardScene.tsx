"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { Airliner } from "@/components/umrah/scenes/AirplaneScene";
import { rich } from "@/components/umrah/shared";

export type StoryboardArt = "arrival" | "miqat" | "madinah" | "makkah" | "departure";

/** Bin Aziz's goodbye, shown once the plane has flown out of the frame. */
function Farewell({ p, rite }: { p: MotionValue<number>; rite: string }) {
  const opacity = useTransform(p, [0.6, 0.76], [0, 1]);
  const y = useTransform(p, [0.6, 0.76], [24, 0]);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-[7%] top-[16%] bottom-[6%] flex flex-col items-center justify-center text-center text-ivory-50">
      <p className="font-arabic text-2xl text-gold-300 md:text-3xl" lang="ar" dir="rtl">
        فِي أَمَانِ اللّٰه
      </p>
      <p className="mt-2 font-display text-4xl md:text-6xl">
        Allah <span className="text-gold-gradient italic">Hafiz</span>
      </p>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ivory-100/85 md:text-base">
        {rich(
          `From all of us at Bin Aziz Tourism & Consultants: it was our honour to serve you as a guest of Allah ﷻ. May He accept your ${rite}, forgive your sins and bring you home safely to your family. Keep us in your du‘as — and may He call you back to His House again and again.`,
        )}
      </p>
      <p className="mt-4 text-[10px] font-semibold tracking-[0.3em] text-gold-300 uppercase md:text-xs">Bin Aziz Tourism &amp; Consultants</p>
    </motion.div>
  );
}

/** Passport with visa, and the Bin Aziz Transport voucher — stamped as checked. */
function ArrivalArt({ p }: { p: MotionValue<number> }) {
  const voucherX = useTransform(p, [0.1, 0.35], ["60%", "0%"]);
  const stamp = useTransform(p, [0.45, 0.55], [0, 1]);
  const stampScale = useTransform(p, [0.45, 0.55], [1.6, 1]);
  return (
    <div className="absolute inset-x-[8%] top-[24%] bottom-[30%] flex items-center justify-center gap-[4%]">
      <div className="relative aspect-[3/4] h-full -rotate-6 rounded-xl bg-[#1f3d2f] p-[5%] shadow-2xl ring-1 ring-gold-500/40">
        <p className="text-center text-[8px] font-semibold tracking-[0.2em] text-gold-300 md:text-[10px]">PASSPORT</p>
        <div className="mx-auto mt-[12%] size-[38%] rounded-full border-2 border-gold-400/70" />
        <div className="absolute inset-x-[10%] bottom-[10%] rounded bg-ivory-50/90 py-[4%] text-center text-[7px] font-bold text-night-900 md:text-[9px]">UMRAH VISA</div>
      </div>
      <motion.div style={{ x: voucherX }} className="relative h-[70%] w-[48%] rotate-3 overflow-hidden rounded-xl bg-ivory-50 shadow-2xl">
        <div className="h-[24%] bg-night-900 px-[6%] py-[4%]">
          <p className="text-[7px] font-semibold tracking-[0.2em] text-gold-300 md:text-[10px]">BIN AZIZ TRANSPORT</p>
        </div>
        <div className="space-y-[5%] p-[6%]">
          <p className="text-[8px] font-bold text-night-900 md:text-xs">TRANSFER VOUCHER</p>
          <div className="h-1.5 w-3/4 rounded bg-night-900/15" />
          <div className="h-1.5 w-1/2 rounded bg-night-900/15" />
          <div className="mt-[8%] flex gap-[3%]">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} className="h-5 bg-night-900" style={{ width: i % 3 ? 2 : 4 }} />
            ))}
          </div>
        </div>
        <motion.div
          style={{ opacity: stamp, scale: stampScale }}
          className="absolute right-[8%] bottom-[10%] grid size-[38%] place-items-center rounded-full border-4 border-emerald-500 text-[7px] leading-none font-black text-emerald-600 md:text-[10px]"
        >
          ✓ CHECKED
        </motion.div>
      </motion.div>
    </div>
  );
}

function Mosque({ dome, accent }: { dome: string; accent: string }) {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax meet" className="absolute inset-x-0 bottom-[22%] h-[52%] w-full" aria-hidden>
      <rect x="60" y="120" width="280" height="80" fill="#e9e2d3" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${72 + i * 30} 200 L${72 + i * 30} 160 Q${84 + i * 30} 140 ${96 + i * 30} 160 L${96 + i * 30} 200 Z`} fill="#c9bfa9" />
      ))}
      <path d="M150 120 Q200 30 250 120 Z" fill={dome} />
      <rect x="198" y="40" width="4" height="22" fill={accent} />
      {[40, 360].map((x) => (
        <g key={x}>
          <rect x={x - 7} y="30" width="14" height="170" fill="#efe9dc" />
          <rect x={x - 11} y="80" width="22" height="6" fill={accent} />
          <path d={`M${x - 7} 30 L${x} 8 L${x + 7} 30 Z`} fill={accent} />
        </g>
      ))}
    </svg>
  );
}

/** A tall hotel beside the Green Dome, leaving Madinah. */
function MadinahHotelArt() {
  return (
    <div className="absolute inset-x-0 top-[15%] bottom-[5%] flex flex-col items-center justify-end">
      <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMax meet" className="min-h-0 w-full flex-1" aria-hidden>
        <path d="M250 230 L250 190 Q300 120 350 190 L350 230 Z" fill="#1f8a5b" />
        <rect x="298" y="118" width="4" height="26" fill="#dcc08a" />
        <rect x="235" y="190" width="130" height="50" fill="#e9e2d3" />
        {Array.from({ length: 5 }, (_, i) => (
          <path key={i} d={`M${245 + i * 24} 240 V215 Q${254 + i * 24} 200 ${263 + i * 24} 215 V240 Z`} fill="#c9bfa9" />
        ))}
        <rect x="90" y="16" width="130" height="224" rx="4" fill="#d9c49a" />
        <rect x="80" y="8" width="150" height="12" rx="3" fill="#c9a35b" />
        {Array.from({ length: 11 }, (_, r) =>
          Array.from({ length: 5 }, (_, c) => <rect key={`${r}${c}`} x={102 + c * 22} y={30 + r * 16} width="14" height="9" rx="1" fill={(r * 3 + c) % 4 ? "#ffd98a" : "#2c3e75"} />),
        )}
        <rect x="136" y="210" width="38" height="30" rx="2" fill="#c9a35b" />
        <rect x="0" y="240" width="400" height="20" fill="#141d42" />
      </svg>
      <p className="mt-2 font-display text-4xl tracking-[0.3em] text-gold-300 md:text-5xl">MED</p>
      <p className="text-[10px] tracking-[0.25em] text-ivory-100/70 uppercase">Madinah · your hotel</p>
    </div>
  );
}

function MakkahArt() {
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMax meet" className="absolute inset-x-0 bottom-[22%] h-[60%] w-full" aria-hidden>
      <rect x="175" y="40" width="50" height="180" fill="#cfc4ac" />
      <rect x="183" y="10" width="34" height="34" fill="#d9ceb5" />
      <circle cx="200" cy="27" r="11" fill="#f6efd9" />
      <path d="M200 27 L200 20 M200 27 L205 29" stroke="#0a1128" strokeWidth="1.5" />
      <rect x="198" y="0" width="4" height="10" fill="#dcc08a" />
      {[60, 110, 280, 330].map((x, i) => (
        <rect key={x} x={x} y={120 + (i % 2) * 20} width="40" height={100 - (i % 2) * 20} fill="#1b2550" />
      ))}
    </svg>
  );
}

/**
 * Stand-in scene for a phase whose full animation is still to be built: a simple illustration and the
 * phase's steps lighting up one by one as you scroll.
 */
export function StoryboardScene({ progress, art, steps, rite = "Umrah" }: { progress: MotionValue<number>; art: StoryboardArt; steps: string[]; rite?: string }) {
  // the plane is gone before the farewell message fades in
  const planeY = useTransform(progress, [0.15, 0.55], ["0%", "-600%"]);
  const planeX = useTransform(progress, [0.15, 0.55], ["0%", "190%"]);
  const runway = useTransform(progress, [0.4, 0.56], [1, 0]);
  const planeRotate = useTransform(progress, [0.12, 0.3], [0, -14]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#1b2550] via-night-800 to-night-950">
      <div className="bg-islamic-pattern absolute inset-0 opacity-60" />
      {art === "arrival" && <ArrivalArt p={progress} />}
      {art === "miqat" && <MadinahHotelArt />}
      {art === "madinah" && <Mosque dome="#1f8a5b" accent="#dcc08a" />}
      {art === "makkah" && <MakkahArt />}
      {art === "departure" && (
        <>
          <motion.div style={{ opacity: runway }} className="absolute inset-x-0 bottom-[22%] h-[3%] bg-[#3a4680]" />
          <motion.div style={{ x: planeX, y: planeY, rotate: planeRotate }} className="absolute bottom-[25%] left-[8%] w-[42%]">
            <Airliner className="w-full drop-shadow-[0_14px_20px_rgb(0_0_0/0.5)]" />
          </motion.div>
        </>
      )}

      <ol className="absolute inset-x-[5%] bottom-[5%] flex flex-wrap gap-1.5 md:gap-2">
        {steps.map((s, i) => (
          <Step key={s} progress={progress} at={(i / Math.max(1, steps.length)) * 0.85} label={s} />
        ))}
      </ol>
      {art === "departure" && <Farewell p={progress} rite={rite} />}
      <p className={`absolute top-[18%] right-[5%] rounded-full border border-ivory-100/20 bg-night-950/60 px-3 py-1 text-[9px] tracking-[0.2em] text-ivory-100/60 uppercase backdrop-blur md:top-[14%] md:text-[10px] ${art === "miqat" || art === "departure" ? "hidden" : ""}`}>
        Storyboard · full scene next
      </p>
    </div>
  );
}

function Step({ progress, at, label }: { progress: MotionValue<number>; at: number; label: string }) {
  const opacity = useTransform(progress, [at, at + 0.06], [0.3, 1]);
  const y = useTransform(progress, [at, at + 0.06], [6, 0]);
  return (
    <motion.li style={{ opacity, y }} className="rounded-full border border-gold-500/30 bg-night-950/70 px-3 py-1.5 text-[10px] text-ivory-50 backdrop-blur md:text-xs">
      {label}
    </motion.li>
  );
}
