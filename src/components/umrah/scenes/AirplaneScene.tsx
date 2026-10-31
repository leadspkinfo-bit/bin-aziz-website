"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { useLocal } from "../shared";

const STARS = Array.from({ length: 34 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 55,
  size: i % 5 === 0 ? 2.5 : 1.5,
  delay: (i % 7) * 0.5,
}));

export function Airliner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 80" className={className} aria-hidden>
      <defs>
        <linearGradient id="fuselage" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c8cfdc" />
        </linearGradient>
      </defs>
      {/* far wing */}
      <path d="M118 36 L92 6 L104 6 L144 36 Z" fill="#aab4c6" />
      {/* tail fin */}
      <path d="M30 36 L14 6 L28 6 L52 34 Z" fill="#c9a35b" />
      {/* body */}
      <path d="M18 34 C18 28 30 26 46 26 L178 26 C196 26 212 32 214 40 C212 47 198 52 178 52 L44 52 C28 52 18 44 18 34 Z" fill="url(#fuselage)" />
      {/* gold cheat line + windows */}
      <rect x="40" y="43" width="150" height="2.4" rx="1.2" fill="#c9a35b" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect key={i} x={58 + i * 7.4} y="33" width="3.6" height="4.6" rx="1.6" fill="#243263" />
      ))}
      <path d="M190 31 C198 32 205 35 207 38 L194 38 Z" fill="#243263" />
      {/* near wing + engine */}
      <path d="M112 44 L84 76 L98 76 L146 46 Z" fill="#e3e8f0" />
      <rect x="104" y="54" width="26" height="9" rx="4.5" fill="#9aa5b9" />
      {/* tailplane */}
      <path d="M26 40 L8 52 L20 52 L46 42 Z" fill="#dfe4ec" />
    </svg>
  );
}

/** Phase 1: the plane drifts down and across the night sky and crosses the Miqat line. */
/**
 * `ihram` false: the visitor flies to Madinah first, so there is no Miqat on this flight — the boundary
 * and the Niyyah prompt are left out. `destination` names the landing airport.
 */
export function AirplaneScene({ scene, ihram = true, destination = "Jeddah" }: { scene: MotionValue<number>; ihram?: boolean; destination?: string }) {
  const p = useLocal(scene, 0);
  const left = useTransform(p, [0, 1], ["-4%", "64%"]);
  const top = useTransform(p, [0, 1], ["24%", "50%"]);
  const cloudsFar = useTransform(p, [0, 1], ["0%", "-30%"]);
  const cloudsNear = useTransform(p, [0, 1], ["10%", "-60%"]);
  const crossed = useTransform(p, [0.4, 0.5, 0.76, 0.84], ihram ? [0, 1, 1, 0] : [0, 0, 0, 0]);
  const lineGlow = useTransform(p, [0.3, 0.45, 0.6], ihram ? [0.35, 1, 0.55] : [0, 0, 0]);
  const ihramTag = useTransform(p, [0, 0.12, 0.35, 0.42], ihram ? [0, 1, 1, 0] : [0, 0, 0, 0]);
  const landing = useTransform(p, [0.8, 0.92], [0, 1]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-night-950 via-night-800 to-[#3a3360]">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="absolute animate-twinkle rounded-full bg-ivory-50"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        />
      ))}
      <div className="absolute -bottom-20 left-1/2 h-64 w-[140%] -translate-x-1/2 rounded-[50%] bg-gold-500/20 blur-3xl" />

      <motion.div style={{ x: cloudsFar }} className="absolute inset-x-0 top-[58%] h-24">
        {[8, 38, 70, 102].map((l) => (
          <span key={l} className="absolute h-10 w-40 rounded-full bg-ivory-50/20 blur-xl" style={{ left: `${l}%` }} />
        ))}
      </motion.div>

      {/* the Miqat boundary */}
      <motion.div style={{ opacity: lineGlow }} className="absolute inset-y-0 left-[58%] flex flex-col items-center">
        <span className="h-full w-px bg-[repeating-linear-gradient(to_bottom,#dcc08a_0_8px,transparent_8px_16px)] shadow-[0_0_12px_#c9a35b]" />
        <span className="absolute top-[17%] rounded-full border border-gold-400/50 bg-night-950/80 px-3 py-1 text-[10px] font-semibold tracking-[0.25em] whitespace-nowrap text-gold-300 uppercase md:text-xs">
          Miqat boundary
        </span>
      </motion.div>

      <motion.div style={{ left, top }} className="absolute w-[34%] min-w-32 rotate-[9deg]">
        <Airliner className="w-full drop-shadow-[0_18px_30px_rgb(0_0_0/0.45)]" />
      </motion.div>

      <motion.div style={{ x: cloudsNear }} className="absolute inset-x-0 bottom-[6%] h-28">
        {[0, 30, 62, 95, 125].map((l) => (
          <span key={l} className="absolute h-16 w-56 rounded-full bg-ivory-50/25 blur-2xl" style={{ left: `${l}%` }} />
        ))}
      </motion.div>

      <motion.p
        style={{ opacity: ihramTag }}
        className="absolute bottom-[10%] left-[6%] rounded-full bg-ivory-50/10 px-4 py-2 text-xs text-ivory-100 backdrop-blur md:text-sm"
      >
        ✓ Ihram worn before boarding
      </motion.p>

      <motion.div style={{ opacity: crossed }} className="absolute bottom-[11%] left-1/2 w-[86%] max-w-md -translate-x-1/2 text-center">
        <p className="text-[10px] font-semibold tracking-[0.3em] text-gold-300 uppercase md:text-xs">Now — Niyyah &amp; Talbiyah</p>
        <p className="mt-2 font-arabic text-base leading-loose text-ivory-50 md:text-2xl" lang="ar" dir="rtl">
          لَبَّيْكَ اللّٰهُمَّ لَبَّيْكَ
        </p>
      </motion.div>

      <motion.p
        style={{ opacity: landing }}
        className="absolute right-[6%] bottom-[10%] rounded-full border border-ivory-100/20 px-4 py-2 text-xs text-ivory-100/80 md:text-sm"
      >
        Landing in {destination}
      </motion.p>
    </div>
  );
}
