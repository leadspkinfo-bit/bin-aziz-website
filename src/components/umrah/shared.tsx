"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { Fragment, type ReactNode, type Ref } from "react";
import { withHonorific } from "@/components/ui/Honorific";
import type { Dua } from "@/lib/umrahGuide";

/** Text with ﷻ written out and ﷺ drawn in Amiri at a readable size (UI fonts render it tiny). */
export function rich(text: string) {
  return text.split("ﷺ").map((part, i) => (
    <Fragment key={i}>
      {i > 0 && (
        <span className="font-arabic text-[1.2em] leading-none" lang="ar">
          ﷺ
        </span>
      )}
      {withHonorific(part)}
    </Fragment>
  ));
}

/** 0 → 1 while `scene` moves through phase `i` (scene is i at the start of phase i, i + 1 at its end). */
export function useLocal(scene: MotionValue<number>, i: number) {
  return useTransform(scene, (v) => Math.min(1, Math.max(0, v - i)));
}

/**
 * Opacity of scene layer `i`: fades in over the last stretch of the previous phase, holds, and
 * hands over to the next layer at the end of its own phase. Hidden layers are also made
 * invisible to clicks and keyboard focus.
 */
export function useLayer(scene: MotionValue<number>, i: number, last = false) {
  const opacity = useTransform(scene, last ? [i - 0.18, i] : [i - 0.18, i, i + 0.82, i + 1], last ? [0, 1] : [0, 1, 1, 0]);
  const visibility = useTransform(opacity, (o) => (o < 0.02 ? "hidden" : "visible"));
  const pointerEvents = useTransform(opacity, (o) => (o > 0.6 ? "auto" : "none"));
  return { opacity, visibility, pointerEvents };
}

/** Full-size scene layer inside the stage. */
export function SceneLayer({ scene, index, last, children, className = "" }: { scene: MotionValue<number>; index: number; last?: boolean; children: ReactNode; className?: string }) {
  const style = useLayer(scene, index, last);
  return (
    <motion.div style={style} className={`absolute inset-0 ${className}`}>
      {children}
    </motion.div>
  );
}

/** Text column wrapper for one phase of the journey. */
export function PhaseShell({
  ref,
  id,
  step,
  eyebrow,
  title,
  arabic,
  children,
}: {
  ref?: Ref<HTMLElement>;
  id: string;
  step: string;
  eyebrow: string;
  title: ReactNode;
  arabic?: string;
  children: ReactNode;
}) {
  return (
    <section ref={ref} id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* the journey's cards are numbered by the itinerary now, so the fixed step number stays hidden */}
        <span className="sr-only">Step {step}</span>
        <p className="mt-4 text-xs font-semibold tracking-[0.3em] text-gold-600 uppercase">{eyebrow}</p>
        <h2 id={`${id}-title`} className="mt-3 font-display text-4xl leading-[1.05] font-medium text-night-900 md:text-5xl">
          {title}
        </h2>
        {arabic && (
          <p className="mt-3 font-arabic text-2xl text-gold-600" lang="ar" dir="rtl">
            {arabic}
          </p>
        )}
        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-ink/75 md:text-base">{children}</div>
      </motion.div>
    </section>
  );
}

export function DuaCard({ dua, label, dark = false }: { dua: Dua; label?: string; dark?: boolean }) {
  return (
    <figure
      className={`relative overflow-hidden rounded-3xl border p-6 md:p-7 ${
        dark ? "border-gold-500/25 bg-night-900 text-ivory-50" : "border-gold-500/25 bg-gradient-to-br from-ivory-100 to-white"
      }`}
    >
      <div className="bg-islamic-pattern absolute inset-0 opacity-60" aria-hidden />
      <div className="relative">
        {label && <p className={`text-[11px] font-semibold tracking-[0.3em] uppercase ${dark ? "text-gold-400" : "text-gold-600"}`}>{label}</p>}
        <p className={`mt-4 font-arabic text-2xl leading-[2] md:text-[1.7rem] ${dark ? "text-gold-300" : "text-night-900"}`} lang="ar" dir="rtl">
          {dua.arabic}
        </p>
        <p className={`mt-4 text-sm italic ${dark ? "text-ivory-100/80" : "text-night-900/80"}`}>{dua.transliteration}</p>
        <figcaption className={`mt-2 text-sm ${dark ? "text-ivory-100/55" : "text-ink/60"}`}>{dua.meaning}</figcaption>
      </div>
    </figure>
  );
}

export function Checklist({ items, tone = "gold" }: { items: readonly string[]; tone?: "gold" | "rose" }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span
            className={`mt-2 size-1.5 shrink-0 rotate-45 ${tone === "rose" ? "bg-rose-400" : "bg-gold-500"}`}
            aria-hidden
          />
          <span>{rich(item)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Numbered({ items }: { items: readonly (string | { title: string; text: string })[] }) {
  return (
    <ol className="relative space-y-6 border-l border-gold-500/30 pl-8">
      {items.map((item, i) => (
        <li key={i} className="relative">
          <span className="absolute top-0 -left-[2.6rem] grid size-7 place-items-center rounded-full border border-gold-500/40 bg-ivory-50 text-[11px] font-semibold text-gold-600 tabular-nums">
            {i + 1}
          </span>
          {typeof item === "string" ? (
            rich(item)
          ) : (
            <>
              <p className="font-semibold text-night-900">{item.title}</p>
              <p className="mt-1">{item.text}</p>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Small callout box used for rules that must not be missed. */
export function Callout({ title, children, tone = "night" }: { title: string; children: ReactNode; tone?: "night" | "green" }) {
  return (
    <div
      className={`rounded-2xl border-l-4 p-5 ${
        tone === "green" ? "border-emerald-500 bg-emerald-50 text-emerald-950" : "border-gold-500 bg-night-900 text-ivory-100/85"
      }`}
    >
      <p className={`text-xs font-semibold tracking-[0.25em] uppercase ${tone === "green" ? "text-emerald-700" : "text-gold-400"}`}>{title}</p>
      <div className="mt-2 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
