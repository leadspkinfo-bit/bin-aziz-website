"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/icons";
import type { HaramItem } from "@/lib/haramHistoricalData";
import { rich } from "./shared";

function Heading({ children }: { children: string }) {
  return <h3 className="text-xs font-semibold tracking-[0.3em] text-gold-600 uppercase">{children}</h3>;
}

/** Detail card for a point of interest in the Haram. Rendered through a portal by the parent (inside <AnimatePresence>). */
export function HotspotModal({ spot, onClose }: { spot: HaramItem; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus();
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hotspot-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] grid place-items-end bg-night-950/70 backdrop-blur-sm sm:place-items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.article
        initial={{ y: 40, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 260 }}
        className="relative max-h-[88svh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-ivory-50 shadow-2xl sm:rounded-[2rem]"
      >
        <header className="relative overflow-hidden bg-night-900 px-6 pt-8 pb-7 text-ivory-50 md:px-8">
          <div className="bg-islamic-pattern absolute inset-0" aria-hidden />
          <div className="absolute -top-20 -right-16 size-56 rounded-full bg-gold-500/25 blur-3xl" aria-hidden />
          <button
            ref={close}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 grid size-10 place-items-center rounded-full border border-ivory-100/20 transition hover:border-gold-400 hover:text-gold-300"
          >
            <Icon name="close" className="size-5" />
          </button>
          <div className="relative pr-12">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-gold-400/80 uppercase">{spot.category}</p>
            {spot.arabic && (
              <p className="mt-3 font-arabic text-2xl text-gold-400" lang="ar">
                {spot.arabic}
              </p>
            )}
            <h2 id="hotspot-title" className="mt-1 font-display text-3xl font-medium md:text-4xl">
              {spot.name}
            </h2>
            <p className="mt-1 text-sm text-ivory-100/65">{rich(spot.tagline)}</p>
          </div>
        </header>

        {spot.image && (
          <figure className="border-b border-night-900/10 bg-night-950">
            {/* Commons serves the photo directly; next/image would need the remote host configured and a server-side fetch */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={spot.image.src}
              alt={spot.image.caption}
              loading="lazy"
              className="max-h-80 w-full object-contain"
              // if Commons can't be reached, drop the figure rather than show a broken image
              onError={(e) => e.currentTarget.parentElement?.style.setProperty("display", "none")}
            />
            <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-6 py-3 text-xs md:px-8">
              <span className="text-ivory-100/80">{spot.image.caption}</span>
              <a href={spot.image.page} target="_blank" rel="noopener noreferrer" className="text-gold-400 underline-offset-2 hover:underline">
                {spot.image.credit}
              </a>
            </figcaption>
          </figure>
        )}

        <div className="space-y-8 px-6 py-7 text-[15px] leading-relaxed text-ink/75 md:px-8">
          {spot.built && spot.materials && <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gold-500/20 bg-white p-4">
              <Heading>Built / made</Heading>
              <p className="mt-2 text-sm text-night-900">{rich(spot.built)}</p>
            </div>
            <div className="rounded-2xl border border-gold-500/20 bg-white p-4">
              <Heading>Materials</Heading>
              <ul className="mt-2 space-y-1 text-sm text-night-900">
                {spot.materials.map((m) => (
                  <li key={m} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rotate-45 bg-gold-500" aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </section>}

          <section>
            <Heading>{spot.historyLabel ?? "History"}</Heading>
            {spot.history.map((h) => (
              <p key={h} className="mt-3">
                {rich(h)}
              </p>
            ))}
          </section>

          {spot.tips && (
            <ul className="space-y-2 rounded-2xl border border-gold-500/20 bg-white p-4 text-sm text-night-900">
              {spot.tips.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rotate-45 bg-gold-500" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          )}

          {spot.timeline && <section>
            <Heading>Timeline</Heading>
            <ol className="mt-4 space-y-4 border-l border-gold-500/30 pl-6">
              {spot.timeline.map((t) => (
                <li key={t.date + t.event} className="relative">
                  <span className="absolute top-1.5 -left-[1.82rem] size-2.5 rounded-full border-2 border-ivory-50 bg-gold-500" aria-hidden />
                  <p className="text-xs font-semibold tracking-wide text-gold-600">{rich(t.date)}</p>
                  <p className="text-sm text-night-900">{rich(t.event)}</p>
                </li>
              ))}
            </ol>
          </section>}

          {spot.significance && (
            <section>
              <Heading>Religious significance</Heading>
              <ul className="mt-3 space-y-3">
                {spot.significance.map((v) => (
                  <li key={v.text} className="rounded-2xl border border-gold-500/20 bg-white p-4">
                    <p className="text-night-900">{rich(v.text)}</p>
                    <p className="mt-1 text-xs font-semibold tracking-wide text-gold-600">— {v.source}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {spot.practice && (
            <section className="rounded-2xl bg-night-900 p-5 text-sm text-ivory-100/80">
              <h3 className="text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">What to do here</h3>
              <p className="mt-2">{rich(spot.practice)}</p>
            </section>
          )}

          {spot.sources && <section className="border-t border-night-900/10 pt-5">
            <Heading>Sources</Heading>
            <ul className="mt-2 space-y-1 text-xs">
              {spot.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-night-900/70 underline decoration-gold-500/50 underline-offset-2 hover:text-gold-600">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>}
        </div>
      </motion.article>
    </motion.div>
  );
}
