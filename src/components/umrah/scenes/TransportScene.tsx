"use client";

import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { useLayoutEffect, useRef } from "react";
import { useLocal } from "../shared";
import { Airliner } from "./AirplaneScene";

// Route on a 400 × 300 map: start bottom-left, destination top-right (labels come from `leg`).
const ROUTE = "M58 236 C 110 236, 128 196, 168 182 S 236 168, 262 132 S 318 78, 346 66";
const DRIVE_FROM = 0.28; // the van sets off once the plane has landed
const KM = 90;

/** Side view of the transfer van; the Bin Aziz name sits on the body, clear of the wheels. */
function Van({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 84" className={className} aria-hidden>
      <path d="M6 64 L6 20 Q6 8 20 8 L122 8 Q138 8 148 20 L170 46 Q174 50 174 58 L174 64 Z" fill="#fbf8f1" />
      <path d="M128 14 L148 34 L128 34 Z" fill="#243263" />
      {[16, 42, 68, 94].map((x) => (
        <rect key={x} x={x} y="15" width="22" height="19" rx="3" fill="#243263" />
      ))}
      <rect x="6" y="38" width="168" height="3" fill="#c9a35b" />
      <text x="84" y="53" textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="1.4" fill="#0a1128" fontFamily="system-ui, sans-serif">
        BIN AZIZ TRANSPORT
      </text>
      <rect x="166" y="50" width="8" height="5" rx="2" fill="#ecd9a8" />
      {[38, 142].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="68" r="11" fill="#141416" />
          <circle cx={cx} cy="68" r="4.5" fill="#9aa5b9" />
        </g>
      ))}
    </svg>
  );
}

/** Phase 2: the plane lands in Jeddah, then the Bin Aziz van drives the route to Makkah. */
export type TransportRoute = {
  from: string;
  fromNote?: string;
  to: string;
  km: number;
  landing: boolean;
  /** The leg starts at a hotel rather than an airport */
  startHotel?: boolean;
  /** A named stop on the road; `at` is 0 → 1 along the route */
  stop?: { at: number; name: string; note: string };
};
const JEDDAH_TO_MAKKAH: TransportRoute = { from: "Jeddah", fromNote: "King Abdulaziz Airport", to: "Makkah", km: KM, landing: true };

/** `leg` lets the same drive play for any leg (Makkah → Madinah, to the airport, …); without a landing the van sets off at once. */
export function TransportScene({ scene, leg = JEDDAH_TO_MAKKAH }: { scene: MotionValue<number>; leg?: TransportRoute }) {
  const p = useLocal(scene, 1);
  const driveFrom = leg.landing ? DRIVE_FROM : 0.04;
  const route = useRef<SVGPathElement>(null);
  const dot = useRef<SVGGElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const stopMark = useRef<SVGGElement>(null);

  // landing: the plane glides in to the runway, then fades away
  const planeX = useTransform(p, [0, 0.22], ["-30%", "2%"]);
  const planeY = useTransform(p, [0, 0.22], ["-30%", "0%"]);
  const planeScale = useTransform(p, [0, 0.22], [1.25, 0.7]);
  const planeOpacity = useTransform(p, (v) => (leg.landing ? 1 - Math.min(1, Math.max(0, (v - 0.18) / 0.12)) : 0));
  const drive = useTransform(p, [driveFrom, 0.95], [0, 1]);
  const km = useTransform(drive, (v) => `${Math.round(v * leg.km)}`);
  const vanBob = useTransform(p, (v) => Math.sin(v * 160) * 1.2);
  const cardOpacity = useTransform(p, leg.landing ? [0.2, 0.32] : [0, 0.06], [0, 1]);
  const arrived = useTransform(p, [0.9, 0.97], [0, 1]);

  const place = (v: number) => {
    const path = route.current;
    if (!path) return;
    const len = path.getTotalLength();
    const at = path.getPointAtLength(v * len);
    const ahead = path.getPointAtLength(Math.min(len, v * len + 1));
    const angle = (Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180) / Math.PI;
    dot.current?.setAttribute("transform", `translate(${at.x} ${at.y}) rotate(${angle})`);
    if (trail.current) trail.current.style.strokeDashoffset = String(len * (1 - v));
    trail.current?.setAttribute("stroke-dasharray", String(len));
  };
  useMotionValueEvent(drive, "change", place);
  useLayoutEffect(() => {
    place(drive.get());
    const path = route.current;
    if (path && leg.stop) {
      const at = path.getPointAtLength(leg.stop.at * path.getTotalLength());
      stopMark.current?.setAttribute("transform", `translate(${at.x} ${at.y})`);
    }
  });

  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_30%_80%,#2a2c4f,#0a1128_75%)]">
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax meet" className="absolute inset-x-0 bottom-0 h-[78%] w-full" aria-hidden>
        {/* desert terrain */}
        <path d="M0 190 Q90 170 170 200 T400 170 L400 300 L0 300 Z" fill="#1a2249" />
        <path d="M0 240 Q120 220 220 250 T400 230 L400 300 L0 300 Z" fill="#141d42" />
        {[[300, 210], [120, 120], [210, 95], [40, 150], [360, 150]].map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x - 30} ${y} Q${x} ${y - 16} ${x + 30} ${y} Z`} fill="#202a57" />
        ))}
        {/* the road and the part already driven */}
        <path ref={route} d={ROUTE} fill="none" stroke="#0a1128" strokeWidth="9" strokeLinecap="round" />
        <path d={ROUTE} fill="none" stroke="#3a4680" strokeWidth="1" strokeDasharray="5 5" />
        <path ref={trail} d={ROUTE} fill="none" stroke="#dcc08a" strokeWidth="2.4" strokeLinecap="round" />

        {/* start: a runway when the leg begins at an airport */}
        <g transform="translate(58 236)">
          {leg.startHotel && (
            <g transform="translate(-16 -30)">
              <rect width="15" height="26" rx="1" fill="#e4d3b0" />
              {[4, 10, 16].map((y) => (
                <rect key={y} x="3" y={y} width="9" height="3" fill="#243263" />
              ))}
            </g>
          )}
          {leg.fromNote && !leg.startHotel && (
            <>
              <rect x="-34" y="10" width="56" height="5" rx="2" fill="#3a4680" />
              <path d="M-30 12.5 H18" stroke="#ecd9a8" strokeWidth="0.6" strokeDasharray="3 3" />
            </>
          )}
          <circle r="6" fill="#0a1128" stroke="#dcc08a" strokeWidth="1.5" />
          <circle r="2" fill="#dcc08a" />
        </g>
        <text x="30" y="270" fontSize="9" fill="#ecd9a8" fontFamily="system-ui, sans-serif" fontWeight="600" letterSpacing="1">
          {leg.from.toUpperCase()}
        </text>
        <text x="30" y="281" fontSize="6.5" fill="#fbf8f199" fontFamily="system-ui, sans-serif">
          {leg.fromNote}
        </text>

        {/* Makkah */}
        <g transform="translate(346 66)">
          <circle r="16" fill="#c9a35b" opacity="0.18" />
          {leg.to === "Mina" ? (
            // the white tents
            <>
              {[-8, 0, 8].map((x) => (
                <path key={x} d={`M${x - 4} -6 L${x} -13 L${x + 4} -6 Z`} fill="#fbf8f1" />
              ))}
            </>
          ) : leg.to === "Madinah" ? (
            // the green dome of Masjid an-Nabawi
            <>
              <path d="M-8 -6 Q0 -24 8 -6 Z" fill="#1f8a5b" />
              <rect x="-0.8" y="-27" width="1.6" height="5" fill="#dcc08a" />
            </>
          ) : (
            // the clock tower above the Haram
            <>
              <rect x="-2.5" y="-26" width="5" height="22" fill="#dcc08a" />
              <path d="M-2.5 -26 L0 -33 L2.5 -26 Z" fill="#dcc08a" />
              <circle cy="-20" r="1.8" fill="#0a1128" />
            </>
          )}
          <circle r="6" fill="#0a1128" stroke="#dcc08a" strokeWidth="1.5" />
          <circle r="2" fill="#dcc08a" />
        </g>
        <text x="300" y="98" fontSize="9" fill="#ecd9a8" fontFamily="system-ui, sans-serif" fontWeight="600" letterSpacing="1">
          {leg.to.toUpperCase()}
        </text>

        {/* a named stop on the road, with a line up to its label */}
        {leg.stop && (
          <g ref={stopMark}>
            <path d="M0 0 V-48" stroke="#ecd9a8" strokeWidth="0.8" strokeDasharray="2 2" />
            <circle r="4.5" fill="#0a1128" stroke="#ecd9a8" strokeWidth="1.5" />
            <path d="M-11 -48 Q0 -66 11 -48 Z" fill="#f4f1ea" />
            <rect x="-14" y="-48" width="28" height="7" fill="#e9e2d3" />
            <text x="18" y="-56" fontSize="8" fill="#ecd9a8" fontFamily="system-ui, sans-serif" fontWeight="700">
              {leg.stop.name}
            </text>
            <text x="18" y="-46" fontSize="6.5" fill="#fbf8f1cc" fontFamily="system-ui, sans-serif">
              {leg.stop.note}
            </text>
          </g>
        )}

        {/* the van on the map */}
        <g ref={dot}>
          <circle r="9" fill="#c9a35b" opacity="0.25" />
          <rect x="-6" y="-3.5" width="12" height="7" rx="2" fill="#fbf8f1" stroke="#c9a35b" strokeWidth="1" />
          <rect x="2" y="-2.5" width="3" height="5" rx="1" fill="#243263" />
        </g>
      </svg>

      <motion.div style={{ x: planeX, y: planeY, scale: planeScale, opacity: planeOpacity }} className="absolute bottom-[14%] left-[2%] w-[34%] origin-bottom-left -rotate-[4deg]">
        <Airliner className="w-full drop-shadow-[0_14px_20px_rgb(0_0_0/0.5)]" />
      </motion.div>

      {/* trip card */}
      <motion.div
        style={{ opacity: cardOpacity }}
        className="absolute top-[21%] left-[4%] w-[52%] max-w-64 rounded-2xl border border-gold-500/20 bg-night-950/65 p-3 backdrop-blur-md md:top-[18%] md:p-4"
      >
        <motion.div style={{ y: vanBob }}>
          <Van className="w-full" />
        </motion.div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] font-semibold tracking-[0.25em] text-gold-300 uppercase md:text-[10px]">Bin Aziz Transport</p>
            <p className="text-[11px] text-ivory-100/70 md:text-xs">{leg.from} → {leg.to}</p>
          </div>
          <p className="font-display text-2xl leading-none text-ivory-50 tabular-nums md:text-3xl">
            <motion.span>{km}</motion.span>
            <span className="ml-1 text-xs text-ivory-100/60">km</span>
          </p>
        </div>
      </motion.div>

      <motion.p
        style={{ opacity: arrived }}
        className="absolute right-[5%] bottom-[8%] rounded-full bg-gold-500 px-4 py-2 text-xs font-semibold text-night-950 md:text-sm"
      >
        Arrived in {leg.to}
      </motion.p>
    </div>
  );
}
