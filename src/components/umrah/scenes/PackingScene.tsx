"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { PackItem } from "@/lib/journey/leavingHome";

function Item({ item, p, at }: { item: PackItem; p: MotionValue<number>; at: number }) {
  const done = useTransform(p, [at, at + 0.05], [0, 1]);
  const y = useTransform(p, [at - 0.05, at + 0.05], [8, 0]);
  const opacity = useTransform(p, [at - 0.08, at], [0.45, 1]);
  return (
    <motion.li
      style={{ y, opacity }}
      className={`flex min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] backdrop-blur lg:gap-2.5 lg:rounded-xl lg:px-3 lg:py-2 lg:text-sm ${
        item.key ? "border-gold-400/70 bg-gold-500/15 text-gold-200" : "border-ivory-100/15 bg-night-950/50 text-ivory-50"
      }`}
    >
      <span className="relative grid size-4 shrink-0 place-items-center rounded-full border border-ivory-100/30 lg:size-5">
        <motion.span style={{ opacity: done, scale: done }} className="absolute inset-0 grid place-items-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
          ✓
        </motion.span>
      </span>
      <span className="truncate">{item.label}</span>
    </motion.li>
  );
}

/** Packing at home: each item is ticked off as you scroll, and the case closes when everything is in. */
export function PackingScene({ progress, items }: { progress: MotionValue<number>; items: PackItem[] }) {
  const lid = useTransform(progress, [0.86, 0.97], [-62, 0]);
  const doneTag = useTransform(progress, [0.94, 1], [0, 1]);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,#26336b,#0a1128_70%)]">
      <div className="bg-islamic-pattern absolute inset-0 opacity-60" />
      <div className="absolute inset-x-[4%] top-[18%] bottom-[5%] flex gap-[4%] lg:inset-x-[5%] lg:top-[16%] lg:bottom-[6%]">
        {/* the small phone stage has no room for the case: two columns of items instead */}
        <ol className="grid w-full grid-cols-2 content-center gap-1.5 lg:flex lg:w-[56%] lg:flex-col lg:justify-center lg:gap-2">
          {items.map((it, i) => (
            <Item key={it.id} item={it} p={progress} at={0.05 + (i / items.length) * 0.8} />
          ))}
        </ol>
        {/* the suitcase */}
        <div className="relative hidden flex-1 items-center justify-center [perspective:600px] lg:flex">
          <div className="relative aspect-[4/3] w-full max-w-56">
            <div className="absolute inset-0 rounded-2xl bg-[#3a2a1c] shadow-2xl ring-2 ring-[#5a4330]" />
            <div className="absolute inset-[8%] rounded-xl bg-[#e9e2d3]/90" />
            <motion.div style={{ rotateX: lid, transformOrigin: "top" }} className="absolute inset-x-0 top-0 h-full rounded-2xl bg-[#4a3626] ring-2 ring-[#5a4330]" />
            <div className="absolute -top-[10%] left-1/2 h-[12%] w-[34%] -translate-x-1/2 rounded-t-lg border-4 border-b-0 border-[#5a4330]" />
          </div>
          <motion.p style={{ opacity: doneTag }} className="absolute bottom-[8%] rounded-full bg-gold-500 px-3 py-1.5 text-xs font-semibold text-night-950">
            Packed — off to the airport
          </motion.p>
        </div>
      </div>
    </div>
  );
}
