import type { Ref } from "react";
import { withHonorific } from "@/components/ui/Honorific";
import { halq } from "@/lib/umrahGuide";
import { Checklist, PhaseShell } from "../shared";

function GenderCard({ title, points, icon, dark }: { title: string; points: readonly string[]; icon: string; dark?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 md:p-7 ${dark ? "bg-night-900 text-ivory-100/80" : "border border-gold-500/30 bg-white"}`}>
      <div className="flex items-center gap-3">
        <span className={`grid size-11 place-items-center rounded-full text-lg ${dark ? "bg-gold-500/15 text-gold-300" : "bg-ivory-100 text-gold-600"}`} aria-hidden>
          {icon}
        </span>
        <h3 className={`font-display text-2xl ${dark ? "text-ivory-50" : "text-night-900"}`}>{title}</h3>
      </div>
      <div className="mt-5 text-sm">
        <Checklist items={points} />
      </div>
    </div>
  );
}

export function HalqTaqsir({ ref }: { ref?: Ref<HTMLElement> }) {
  return (
    <PhaseShell
      ref={ref}
      id="halq"
      step="06"
      eyebrow="Halq or Taqsir · leaving Ihram"
      title={
        <>
          The final step — <span className="italic text-gold-600">and your Umrah is complete.</span>
        </>
      }
      arabic="الْحَلْق وَالتَّقْصِير"
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <GenderCard title={halq.men.title} points={halq.men.points} icon="✂" dark />
        <GenderCard title={halq.women.title} points={halq.women.points} icon="✂" />
      </div>

      <ul className="space-y-1 text-sm text-ink/60">
        {halq.notes.map((n) => (
          <li key={n}>· {n}</li>
        ))}
      </ul>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 p-7 text-night-950 md:p-9">
        <div className="bg-islamic-pattern absolute inset-0 opacity-60" aria-hidden />
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase">Umrah complete</p>
          <p className="mt-3 font-display text-2xl leading-snug md:text-3xl">{withHonorific(halq.complete)}</p>
          <p className="mt-4 font-arabic text-2xl" lang="ar" dir="rtl">
            {halq.closing}
          </p>
        </div>
      </div>
    </PhaseShell>
  );
}
