"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { halq } from "@/lib/umrahGuide";
import { useLocal } from "../shared";

// Timeline over the Halq phase (0 → 1)
const TRIM = [0.08, 0.26] as const; // men: even trim (Taqsir)
const SHAVE = [0.36, 0.52] as const; // men: full shave (Halq)
const MARK = [0.06, 0.15] as const; // women: the fingertip length is marked…
const SNIP = [0.18, 0.25] as const; // …the scissors close…
const FALL = [0.27, 0.4] as const; // …and the tip falls away
const HIDE = [0.56, 0.62] as const; // both figures leave completely…
const DONE = [0.62, 0.7] as const; // …then "Umrah Mubarak"…
const TICK = [0.72, 0.84] as const; // …then the check mark
const R = 34;
const C = 2 * Math.PI * R;

const HAIR = "#2b1d14";
const SKIN = "#cfa27b";

const TUFTS = Array.from({ length: 11 }, (_, i) => {
  const a = Math.PI * (0.08 + (i / 10) * 0.84);
  // rounded so the server and the browser print identical attributes
  return { x: +(80 - Math.cos(a) * 40).toFixed(2), y: +(74 - Math.sin(a) * 48).toFixed(2) };
});
const CLIPPINGS = [52, 64, 74, 86, 96, 108, 70, 90];

/** Abstract head and shoulders in Ihram — no face — whose hair is trimmed, then shaved. */
function MenFigure({ p }: { p: MotionValue<number> }) {
  const thick = useTransform(p, [TRIM[0], TRIM[1]], [9, 3]);
  const rx = useTransform(thick, (t) => 34 + t);
  const ry = useTransform(thick, (t) => 42 + t);
  const tufts = useTransform(p, [TRIM[0], TRIM[0] + 0.12], [1, 0]);
  const hair = useTransform(p, [SHAVE[0], SHAVE[1]], [1, 0]);
  const stubble = useTransform(p, [SHAVE[0] + 0.05, SHAVE[1]], [0, 0.45]);
  const fall = useTransform(p, [TRIM[0], TRIM[1]], [0, 70]);
  const clipOpacity = useTransform(p, [TRIM[0], TRIM[0] + 0.03, TRIM[1] - 0.05, TRIM[1]], [0, 1, 1, 0]);
  const razorX = useTransform(p, [SHAVE[0], SHAVE[1]], [36, 124]);
  const razorOpacity = useTransform(p, [SHAVE[0] - 0.02, SHAVE[0], SHAVE[1], SHAVE[1] + 0.03], [0, 1, 1, 0]);
  const shaveEdge = useTransform(p, [SHAVE[0], SHAVE[1]], [36, 126]);

  return (
    <svg viewBox="0 0 160 190" className="h-full w-full" aria-hidden>
      <defs>
        <clipPath id="hairline">
          <rect x="0" y="0" width="160" height="66" />
        </clipPath>
        {/* the razor clears the hair from left to right */}
        <clipPath id="unshaved">
          <motion.rect x={shaveEdge} y="0" width="200" height="190" />
        </clipPath>
        <pattern id="stubble" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.7" fill={HAIR} />
        </pattern>
      </defs>
      {/* Ihram over the shoulders */}
      <path d="M14 190 Q18 138 80 132 Q142 138 146 190 Z" fill="#f4f1ea" />
      <path d="M40 150 Q70 170 104 140 M50 176 Q90 168 120 150" stroke="#d9d3c6" strokeWidth="2" fill="none" />
      <rect x="69" y="108" width="22" height="30" rx="8" fill={SKIN} />
      <ellipse cx="80" cy="78" rx="34" ry="42" fill={SKIN} />
      <ellipse cx="46" cy="82" rx="4" ry="7" fill={SKIN} />
      <ellipse cx="114" cy="82" rx="4" ry="7" fill={SKIN} />

      <motion.ellipse cx="80" cy="74" rx="34" ry="42" fill="url(#stubble)" clipPath="url(#hairline)" style={{ opacity: stubble }} />
      <motion.g style={{ opacity: hair }} clipPath="url(#unshaved)">
        <motion.ellipse cx="80" cy="74" rx={rx} ry={ry} fill={HAIR} clipPath="url(#hairline)" />
        <motion.g style={{ opacity: tufts }}>
          {TUFTS.map((t, i) => (
            <circle key={i} cx={t.x} cy={t.y} r="8" fill={HAIR} />
          ))}
        </motion.g>
      </motion.g>

      {/* trimmed hair falling */}
      <motion.g style={{ y: fall, opacity: clipOpacity }}>
        {CLIPPINGS.map((x, i) => (
          <path key={i} d={`M${x} ${28 + (i % 3) * 6} q3 4 0 8`} stroke={HAIR} strokeWidth="2" fill="none" strokeLinecap="round" />
        ))}
      </motion.g>

      {/* razor */}
      <motion.g style={{ x: razorX, opacity: razorOpacity }}>
        <rect x="-4" y="20" width="8" height="16" rx="2" fill="#dcc08a" />
        <rect x="-2" y="36" width="4" height="22" rx="2" fill="#9aa5b9" />
      </motion.g>
    </svg>
  );
}

const BRAID = Array.from({ length: 10 }, (_, k) => ({ y: 26 + k * 16, flip: k % 2 === 0 }));

/** A braid with exactly one fingertip's length marked at the end, snipped and falling away. */
function WomenFigure({ p }: { p: MotionValue<number> }) {
  const mark = useTransform(p, [MARK[0], MARK[1]], [0, 1]);
  const blades = useTransform(p, [SNIP[0], SNIP[1]], [26, 4]);
  const scissors = useTransform(p, [MARK[1], SNIP[0], FALL[0], FALL[0] + 0.06], [0, 1, 1, 0]);
  const flash = useTransform(p, [SNIP[1] - 0.01, SNIP[1], SNIP[1] + 0.04], [0, 1, 0]);
  const tipY = useTransform(p, [FALL[0], FALL[1]], [0, 60]);
  const tipRotate = useTransform(p, [FALL[0], FALL[1]], [0, 24]);
  const tipOpacity = useTransform(p, [FALL[1] - 0.06, FALL[1]], [1, 0]);
  const bladeA = useTransform(blades, (b) => -b);

  return (
    <svg viewBox="0 0 140 240" className="h-full w-full" aria-hidden>
      <rect x="54" y="10" width="20" height="8" rx="4" fill="#c9a35b" />
      {BRAID.map((b) => (
        <ellipse
          key={b.y}
          cx={b.flip ? 60 : 68}
          cy={b.y}
          rx="13"
          ry="10"
          transform={`rotate(${b.flip ? 28 : -28} ${b.flip ? 60 : 68} ${b.y})`}
          fill={HAIR}
          stroke="#5a3b26"
          strokeWidth="1.5"
        />
      ))}
      <rect x="55" y="184" width="18" height="6" rx="3" fill="#c9a35b" />

      {/* the tip: one fingertip's length below the tie */}
      <motion.g style={{ y: tipY, rotate: tipRotate, opacity: tipOpacity, originX: 0.5, originY: 0 }}>
        <path d="M56 192 Q64 190 72 192 L70 206 Q64 216 58 206 Z" fill={HAIR} stroke="#5a3b26" strokeWidth="1.2" />
      </motion.g>

      {/* fingertip measure */}
      <motion.g style={{ opacity: mark }}>
        <rect x="52" y="191" width="24" height="23" rx="4" fill="none" stroke="#ecd9a8" strokeWidth="1.4" strokeDasharray="3 2" />
        <rect x="92" y="186" width="13" height="34" rx="6.5" fill={SKIN} />
        <path d="M94.5 190 h8 a2 2 0 0 1 0 0 v6 a4 4 0 0 1 -8 0 Z" fill="#e9c9a8" />
        <path d="M84 191 h4 M84 214 h4 M86 191 v23" stroke="#ecd9a8" strokeWidth="1.2" />
      </motion.g>

      {/* scissors closing on the cut line */}
      <motion.g style={{ opacity: scissors }}>
        <motion.g style={{ rotate: bladeA, originX: 0.35, originY: 0.5 }}>
          <path d="M30 192 L56 192" stroke="#d8dce4" strokeWidth="3" strokeLinecap="round" />
          <circle cx="22" cy="192" r="6" fill="none" stroke="#dcc08a" strokeWidth="2.5" />
        </motion.g>
        <motion.g style={{ rotate: blades, originX: 0.35, originY: 0.5 }}>
          <path d="M30 192 L56 192" stroke="#d8dce4" strokeWidth="3" strokeLinecap="round" />
          <circle cx="22" cy="192" r="6" fill="none" stroke="#dcc08a" strokeWidth="2.5" />
        </motion.g>
      </motion.g>
      <motion.path d="M46 192 H82" stroke="#ffffff" strokeWidth="2" style={{ opacity: flash }} />
    </svg>
  );
}

function Panel({ title, caption, children }: { title: string; caption: MotionValue<string>; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-2xl border border-gold-500/15 bg-night-950/40 p-2 md:p-4">
      <p className="text-[10px] font-semibold tracking-[0.3em] text-gold-300 uppercase md:text-xs">{title}</p>
      <div className="mt-1 min-h-0 w-full flex-1">{children}</div>
      <motion.p className="mt-1 min-h-[2.5em] text-center text-[10px] leading-tight text-ivory-50 md:text-sm">{caption}</motion.p>
    </div>
  );
}

/** Phase 6: Halq / Taqsir shown abstractly for men and women, then Umrah complete. */
export function HalqScene({ scene }: { scene: MotionValue<number> }) {
  const p = useLocal(scene, 5);
  const men = useTransform(p, (v): string =>
    v < TRIM[0] ? "Hair before leaving Ihram" : v < SHAVE[0] - 0.04 ? "Taqsir — trimmed evenly, all over" : "Halq — fully shaved (best)",
  );
  const women = useTransform(p, (v): string =>
    v < MARK[0] ? "The end of the braid" : v < FALL[0] ? "Mark one fingertip’s length" : "Only the tip is cut — never shaved",
  );
  const done = useTransform(p, [DONE[0], DONE[1]], [0, 1]);
  const doneY = useTransform(p, [DONE[0], DONE[1]], [20, 0]);
  const figures = useTransform(p, [HIDE[0], HIDE[1]], [1, 0]);
  const figuresVisibility = useTransform(figures, (o) => (o < 0.01 ? "hidden" : "visible"));
  const ring = useTransform(p, [TICK[0], TICK[1] - 0.04], [C, 0]);
  const tick = useTransform(p, [TICK[1] - 0.06, TICK[1]], [1, 0]);
  const tickOpacity = useTransform(p, [TICK[0], TICK[0] + 0.02], [0, 1]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,#2a3468,#0a1128_70%)]">
      <div className="bg-islamic-pattern absolute inset-0 opacity-70" />
      <motion.div style={{ opacity: figures, visibility: figuresVisibility }} className="absolute inset-x-[4%] top-[20%] bottom-[6%] flex gap-3 md:top-[14%] md:gap-5">
        <Panel title="Men" caption={men}>
          <MenFigure p={p} />
        </Panel>
        <Panel title="Women" caption={women}>
          <WomenFigure p={p} />
        </Panel>
      </motion.div>

      <motion.div style={{ opacity: done, y: doneY }} className="pointer-events-none absolute inset-x-0 top-[22%] px-6 text-center md:top-[24%]">
        <p className="font-display text-4xl text-ivory-50 md:text-6xl">
          Umrah <span className="text-gold-gradient italic">Mubarak</span>
        </p>
        <p className="mt-2 font-arabic text-xl text-gold-300 md:text-3xl" lang="ar" dir="rtl">
          {halq.closing}
        </p>
        <p className="mt-2 text-[11px] tracking-[0.25em] text-ivory-100/70 uppercase md:text-xs">Ihram restrictions lifted</p>
      </motion.div>

      {/* the check mark, drawn once the greeting is in place */}
      <motion.svg style={{ opacity: tickOpacity }} viewBox="0 0 80 80" className="absolute top-[64%] left-1/2 w-[min(22%,7rem)] -translate-x-1/2 -translate-y-1/2" aria-hidden>
        <circle cx="40" cy="40" r={R} fill="none" stroke="#ffffff1a" strokeWidth="3" />
        <motion.circle cx="40" cy="40" r={R} fill="none" stroke="#dcc08a" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={C} transform="rotate(-90 40 40)" style={{ strokeDashoffset: ring }} />
        <motion.path d="M26 41 L36 51 L55 30" fill="none" stroke="#ecd9a8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: tick }} />
      </motion.svg>
    </div>
  );
}
