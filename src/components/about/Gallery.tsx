"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";

type Photo = { src: string; title: string; tag: string; chapter?: string; width: number; height: number };

const AUTO_MS = 4500;

const cardsOf = (el: HTMLElement | null) => Array.from(el?.children ?? []) as HTMLElement[];
// a card's position in scroll coordinates (the side gutter is scroll padding, so take it off)
const leftOf = (el: HTMLElement, card: HTMLElement) =>
  card.offsetLeft - el.offsetLeft - (parseFloat(getComputedStyle(el).paddingLeft) || 0);

function Arrow({ dir, className = "" }: { dir: "prev" | "next"; className?: string }) {
  return <Icon name="arrow" className={`${dir === "prev" ? "rotate-180" : ""} ${className}`} />;
}

/**
 * Horizontal photo strip: drifts to the next photo on its own, can be dragged or swiped,
 * and opens any photo full screen in a lightbox (arrows, keyboard, swipe).
 */
export function Gallery({ photos }: { photos: readonly Photo[] }) {
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const paused = useRef(false);
  const drag = useRef({ active: false, x: 0, left: 0, moved: false });
  const [open, setOpen] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);

  // chapters in story order, each with the index of its first photo
  const chapters = photos.reduce<{ name: string; start: number }[]>((list, p, i) => {
    if (p.chapter && list.at(-1)?.name !== p.chapter) list.push({ name: p.chapter, start: i });
    return list;
  }, []);
  const activeChapter = photos[current]?.chapter;

  const cards = () => cardsOf(track.current);

  const jumpTo = (i: number) => {
    const el = track.current;
    const card = cards()[i];
    if (el && card) el.scrollTo({ left: leftOf(el, card), behavior: "smooth" });
  };

  const step = useCallback((dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (dir === 1 && el.scrollLeft >= max - 8) return el.scrollTo({ left: 0, behavior: "smooth" });
    if (dir === -1 && el.scrollLeft <= 8) return el.scrollTo({ left: max, behavior: "smooth" });
    const lefts = cardsOf(el).map((c) => leftOf(el, c));
    const target = dir === 1 ? lefts.find((l) => l > el.scrollLeft + 8) : [...lefts].reverse().find((l) => l < el.scrollLeft - 8);
    el.scrollTo({ left: target ?? 0, behavior: "smooth" });
  }, []);

  // progress bar + auto-advance while the strip is on screen and nobody is using it
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.max(0.08, el.scrollLeft / max) : 1})`;
      // first card at (or just past) the left edge = the photo being looked at
      const lefts = cardsOf(el).map((c) => leftOf(el, c));
      const i = el.scrollLeft >= max - 8 ? lefts.length - 1 : lefts.findIndex((l) => l >= el.scrollLeft - 8);
      setCurrent(Math.max(0, i));
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });

    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setInterval(() => {
      if (!reduced && visible && !paused.current && !drag.current.active) step(1);
    }, AUTO_MS);
    return () => {
      el.removeEventListener("scroll", onScroll);
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [step]);

  // mouse drag (touch scrolls natively)
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !track.current) return;
    drag.current = { active: true, x: e.clientX, left: track.current.scrollLeft, moved: false };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active || !track.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 5 && !d.moved) {
      d.moved = true;
      track.current.style.scrollSnapType = "none";
      track.current.setPointerCapture(e.pointerId);
    }
    if (d.moved) track.current.scrollLeft = d.left - dx;
  };
  const onUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (track.current) track.current.style.scrollSnapType = "";
  };

  return (
    <div
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      className="[--card-h:15rem] [--gutter:1.25rem] sm:[--card-h:19rem] md:[--gutter:max(2rem,calc((100vw-80rem)/2+2rem))] lg:[--card-h:24rem]"
    >
      {chapters.length > 1 && (
        <div className="container-page mb-8 flex items-center gap-4">
          <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chapters.map((c) => {
              const active = c.name === activeChapter;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => jumpTo(c.start)}
                  aria-pressed={active}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.15em] uppercase transition duration-300 ${
                    active
                      ? "border-night-900 bg-night-900 text-ivory-50"
                      : "border-night-900/15 text-night-900/70 hover:border-gold-500 hover:text-night-900"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
          <span className="hidden text-xs tracking-[0.3em] text-night-900/50 tabular-nums sm:block">
            {String(current + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
          </span>
        </div>
      )}

      <div
        ref={track}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onFocus={() => (paused.current = true)}
        onBlur={() => (paused.current = false)}
        className="flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-5 overflow-x-auto scroll-smooth px-[var(--gutter)] pb-2 [scrollbar-width:none] md:gap-7 [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((p, i) => {
          const ratio = Math.min(1.9, Math.max(0.85, p.width / p.height));
          return (
            <figure key={p.src} className="group shrink-0 snap-start" style={{ width: `min(calc(var(--card-h) * ${ratio}), 80vw)` }}>
              <button
                type="button"
                onClick={() => {
                  if (drag.current.moved) return;
                  setOpen(i);
                }}
                aria-label={`Open photo: ${p.title}`}
                className="relative block h-[var(--card-h)] w-full cursor-zoom-in overflow-hidden rounded-[1.75rem] bg-night-900 outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-4"
              >
                <Image
                  src={p.src}
                  alt={p.title}
                  fill
                  draggable={false}
                  sizes="(min-width: 1024px) 50vw, 85vw"
                  className="object-cover transition duration-[1.2s] ease-out group-hover:scale-[1.06]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-night-950/55 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
                <span className="absolute right-4 bottom-4 grid size-11 translate-y-2 place-items-center rounded-full bg-ivory-50/90 text-night-900 opacity-0 backdrop-blur transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              <figcaption className="mt-5 pr-4">
                <span className="text-[11px] font-semibold tracking-[0.3em] text-gold-600 uppercase">{p.tag}</span>
                <span className="mt-1.5 block font-display text-2xl leading-tight text-night-900">{p.title}</span>
                <span className="mt-3 block h-px w-10 bg-gold-500 transition-[width] duration-700 group-hover:w-24" aria-hidden />
              </figcaption>
            </figure>
          );
        })}
      </div>

      <div className="container-page mt-10 flex items-center gap-6">
        <div className="relative h-px flex-1 overflow-hidden bg-night-900/12">
          <span ref={bar} className="absolute inset-0 origin-left bg-gold-500 transition-transform duration-300" />
        </div>
        <div className="flex gap-2">
          {(["prev", "next"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => step(d === "next" ? 1 : -1)}
              aria-label={d === "next" ? "Next photos" : "Previous photos"}
              className="grid size-12 place-items-center rounded-full border border-night-900/15 text-night-900 transition hover:border-gold-500 hover:bg-gold-500 hover:text-night-950"
            >
              <Arrow dir={d} className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {/* portalled to <body>: the section's reveal animation transforms an ancestor, which would trap position:fixed */}
      {open !== null && createPortal(<Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />, document.body)}
    </div>
  );
}

function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: readonly Photo[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const close = useRef<HTMLButtonElement>(null);
  const swipe = useRef<number | null>(null);
  const p = photos[index];
  const go = useCallback((d: number) => onIndex((index + d + photos.length) % photos.length), [index, onIndex, photos.length]);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = overflow;
      prevFocus?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
      className="fixed inset-0 z-[100] flex flex-col bg-night-950/95 text-ivory-50 backdrop-blur-sm motion-safe:animate-[fadeUp_0.3s_ease-out]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex items-center justify-between px-5 py-4 md:px-8">
        <span className="text-xs tracking-[0.3em] text-ivory-100/60 tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
        </span>
        <button
          ref={close}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-11 place-items-center rounded-full border border-ivory-100/20 transition hover:border-gold-400 hover:text-gold-300"
        >
          <Icon name="close" className="size-5" />
        </button>
      </div>

      <div
        className="relative flex-1"
        onPointerDown={(e) => (swipe.current = e.clientX)}
        onPointerUp={(e) => {
          if (swipe.current === null) return;
          const dx = e.clientX - swipe.current;
          swipe.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div key={p.src} className="absolute inset-x-4 inset-y-2 md:inset-x-24 motion-safe:animate-[dialogIn_0.45s_ease-out]">
          <Image src={p.src} alt={p.title} fill quality={92} sizes="100vw" className="object-contain" priority />
        </div>
        {(["prev", "next"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => go(d === "next" ? 1 : -1)}
            aria-label={d === "next" ? "Next photo" : "Previous photo"}
            className={`absolute top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-ivory-100/20 bg-night-950/50 backdrop-blur transition hover:border-gold-400 hover:text-gold-300 max-md:hidden ${
              d === "prev" ? "left-6" : "right-6"
            }`}
          >
            <Arrow dir={d} className="size-5" />
          </button>
        ))}
      </div>

      <div key={`c-${p.src}`} className="px-5 py-6 text-center motion-safe:animate-[fadeUp_0.5s_ease-out] md:py-8">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-gold-400 uppercase">{p.tag}</p>
        <p className="mt-2 font-display text-2xl md:text-3xl">{p.title}</p>
      </div>
    </div>
  );
}
