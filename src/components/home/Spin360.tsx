"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type Frame = { src: string; angle: number };

const VIEWS = [
  { label: "Front", angle: 0 },
  { label: "Side", angle: 90 },
  { label: "Rear", angle: 180 },
  { label: "Side", angle: 270 },
];
const AUTO_SPEED = 20; // degrees per second while idle
const IDLE_MS = 2600;
const BLEND = 9; // degrees

const wrap = (a: number) => ((a % 360) + 360) % 360;
const shortest = (from: number, to: number) => ((to - from + 540) % 360) - 180;

/**
 * Photo-real 360° viewer: real photos taken around the vehicle, cross-faded by angle.
 * Drag (or arrow keys) to turn it, with inertia; it turns slowly on its own while idle.
 * Everything per frame is written straight to the DOM, so React doesn't re-render while spinning.
 */
export function Spin360({ frames, name }: { frames: Frame[]; name: string }) {
  const root = useRef<HTMLDivElement>(null);
  const imgs = useRef<(HTMLImageElement | null)[]>([]);
  const dot = useRef<HTMLSpanElement>(null);
  const state = useRef({ angle: 0, vel: 0, target: null as number | null, dragging: false, lastX: 0, lastT: 0, idleSince: 0 });
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let last = performance.now();
    let visible = false;
    let shown = "";

    const draw = (angle: number) => {
      const a = wrap(angle);
      // the two photos either side of this angle, and how far between them we are
      let i = frames.length - 1;
      for (let k = 0; k < frames.length; k++) if (frames[k].angle <= a) i = k;
      const j = (i + 1) % frames.length;
      const from = frames[i].angle;
      const span = wrap(frames[j].angle - from) || 360;
      // Blend over at most BLEND degrees around the midpoint: where photos are close together the
      // turn is one continuous dissolve, where they are far apart it switches cleanly without ghosting.
      const fade = Math.min(span * 0.8, BLEND);
      const mix = Math.min(1, Math.max(0, (wrap(a - from) - (span - fade) / 2) / fade));
      const eased = mix * mix * (3 - 2 * mix);
      const key = `${i}:${j}:${eased.toFixed(3)}`;
      if (key !== shown) {
        shown = key;
        imgs.current.forEach((img, k) => {
          if (!img) return;
          img.style.opacity = k === i ? "1" : k === j ? String(eased) : "0";
          img.style.zIndex = k === j ? "2" : k === i ? "1" : "0";
        });
      }
      if (dot.current) dot.current.style.left = `${(a / 360) * 100}%`;
      el.setAttribute("aria-valuenow", String(Math.round(a)));
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = state.current;
      if (!s.dragging) {
        if (s.target !== null) {
          const d = shortest(wrap(s.angle), s.target);
          s.angle += d * (1 - Math.exp(-dt * 7));
          if (Math.abs(d) < 0.3) s.target = null;
        } else if (Math.abs(s.vel) > 2) {
          s.angle += s.vel * dt;
          s.vel *= Math.exp(-dt * 3.2);
        } else if (!reduced && now - s.idleSince > IDLE_MS) {
          s.angle += AUTO_SPEED * dt;
        }
      }
      draw(s.angle);
      if (visible) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(el);
    draw(state.current.angle);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [frames]);

  const touch = () => {
    state.current.idleSince = performance.now();
    setHint(false);
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    s.dragging = true;
    s.target = null;
    s.vel = 0;
    s.lastX = e.clientX;
    s.lastT = performance.now();
    e.currentTarget.setPointerCapture(e.pointerId);
    touch();
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = state.current;
    if (!s.dragging) return;
    const now = performance.now();
    const width = e.currentTarget.clientWidth || 800;
    const d = -((e.clientX - s.lastX) / width) * 300;
    s.angle += d;
    const dt = Math.max((now - s.lastT) / 1000, 0.008);
    s.vel = s.vel * 0.6 + (d / dt) * 0.4;
    s.lastX = e.clientX;
    s.lastT = now;
    s.idleSince = now;
  };
  const onUp = () => {
    state.current.dragging = false;
    state.current.idleSince = performance.now();
  };
  const goTo = (angle: number) => {
    state.current.target = angle;
    state.current.vel = 0;
    touch();
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const s = state.current;
    goTo(wrap((s.target ?? wrap(s.angle)) + (e.key === "ArrowRight" ? 30 : -30)));
  };

  return (
    <div className="relative h-full overflow-hidden bg-[#e2e2e6] text-night-900">
      <div
        ref={root}
        role="slider"
        tabIndex={0}
        aria-label={`${name}, 360° view. Use the arrow keys to turn it.`}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={0}
        aria-valuetext="degrees"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
        className="absolute inset-0 cursor-grab touch-pan-y outline-none select-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-inset"
      >
        {frames.map((f, k) => (
          <Image
            key={f.src}
            ref={(el) => {
              imgs.current[k] = el;
            }}
            src={f.src}
            alt={k === 0 ? `${name}, front view` : ""}
            fill
            unoptimized
            priority={k === 0}
            draggable={false}
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="pointer-events-none object-contain"
            style={{ opacity: k === 0 ? 1 : 0 }}
          />
        ))}
      </div>

      {/* studio vignette and a soft top light */}
      <div
        className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,transparent_55%,rgb(10_17_40/0.16))]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-white/50 to-transparent" aria-hidden />

      <p className="pointer-events-none absolute inset-x-0 top-5 z-20 text-center font-display text-2xl text-night-900 md:top-7 md:text-4xl">
        {name}
      </p>

      <div
        className={`pointer-events-none absolute inset-x-0 top-1/2 z-20 flex justify-center transition-opacity duration-700 ${hint ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      >
        <span className="mt-28 inline-flex items-center gap-2 rounded-full bg-night-900/85 px-4 py-2 text-xs font-medium text-ivory-50 shadow-lg backdrop-blur md:mt-40">
          <svg viewBox="0 0 24 24" className="size-4 text-gold-300" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M3 12a9 9 0 0 1 15.5-6.2M21 12a9 9 0 0 1-15.5 6.2" strokeLinecap="round" />
            <path d="M18.5 2.5v3.3h-3.3M5.5 21.5v-3.3h3.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Drag to rotate 360°
        </span>
      </div>

      {/* angle track with quick views */}
      <div className="absolute inset-x-6 bottom-5 z-20 md:inset-x-10">
        <div className="relative h-px bg-night-900/20">
          <span ref={dot} className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500 shadow-[0_0_0_4px_rgb(201_163_91/0.25)]" />
        </div>
        <div className="mt-3 grid grid-cols-4 text-[10px] font-semibold tracking-[0.25em] text-night-900/55 uppercase">
          {VIEWS.map((v) => (
            <button key={v.angle} type="button" onClick={() => goTo(v.angle)} className="text-left transition hover:text-gold-600">
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
