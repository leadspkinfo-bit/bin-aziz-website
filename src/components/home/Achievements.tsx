"use client";

import { useRef } from "react";
import { Icon } from "@/components/icons";
import { achievements, highlights } from "@/lib/content";
import { gsap, useGSAP } from "@/lib/gsap";

export function Achievements() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count);
        const obj = { v: 0 };
        el.textContent = "0";
        gsap.to(obj, {
          v: target,
          duration: 2.2,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString("en-US");
          },
        });
      });
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative overflow-hidden bg-night-900 py-24 text-ivory-50 md:py-32">
      <div className="bg-islamic-pattern absolute inset-0" aria-hidden />
      <div className="absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
      <div className="container-page relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">Key achievements</p>
          <h2 className="mt-5 font-display text-4xl leading-tight font-medium md:text-6xl">
            Built on <span className="text-gold-gradient italic">trust</span>, proven by thousands.
          </h2>
          <p className="mt-6 text-ivory-100/65">
            From organising Umrah journeys to ticketing and visa services, we have signed multiple MOUs
            with leading service providers and built strong B2B networks.
          </p>
        </div>

        <dl className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-gold-500/20 bg-gold-500/20 sm:grid-cols-3">
          {achievements.map((a) => (
            <div key={a.label} className="bg-night-900 px-6 py-12 text-center">
              <dd className="font-display text-6xl text-gold-300 md:text-7xl">
                <span data-count={a.value}>{a.value.toLocaleString("en-US")}</span>
                {a.suffix}
              </dd>
              <dt className="mt-3 text-xs tracking-[0.25em] text-ivory-100/55 uppercase">{a.label}</dt>
            </div>
          ))}
        </dl>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h) => (
            <li key={h.title} className="glass-dark rounded-2xl p-6">
              <Icon name={h.icon} className="size-7 text-gold-400" />
              <h3 className="mt-4 font-display text-2xl">{h.title}</h3>
              <p className="mt-2 text-sm text-ivory-100/60">{h.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
