import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, text, arabic }: { eyebrow: string; title: ReactNode; text?: string; arabic?: string }) {
  return (
    <section className="relative overflow-hidden bg-night-950 pt-40 pb-20 text-ivory-50 md:pt-48 md:pb-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgb(36_50_99/0.9),transparent_60%)]" />
      <div className="bg-islamic-pattern absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container-page relative">
        {arabic && (
          <p className="font-arabic text-2xl text-gold-400" lang="ar" dir="rtl">
            {arabic}
          </p>
        )}
        <p className="mt-4 inline-flex items-center gap-3 text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">
          <span className="h-px w-8 bg-current" /> {eyebrow}
        </p>
        <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[1.02] font-medium md:text-7xl">{title}</h1>
        {text && <p className="mt-6 max-w-2xl text-base leading-relaxed text-ivory-100/65 md:text-lg">{text}</p>}
      </div>
    </section>
  );
}
