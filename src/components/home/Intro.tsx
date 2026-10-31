import { Honorific } from "@/components/ui/Honorific";
import { Reveal } from "@/components/ui/Reveal";
import { values } from "@/lib/content";

function Heading() {
  return (
    <>
      <p className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.3em] text-gold-600 uppercase">
        <span className="h-px w-8 bg-current" /> Introduction
      </p>
      <h2 id="intro-title" className="mt-5 font-display text-4xl leading-[1.05] font-medium text-night-900 md:text-6xl">
        Faith-driven travel,
        <br />
        <span className="italic text-gold-600">Shariah-compliant</span> care.
      </h2>
    </>
  );
}

function Lead({ className }: { className: string }) {
  return (
    <p className={className}>
      Bin Aziz Tourism is committed to serving the guests of Allah <Honorific />. With years of experience in the
      sacred travel industry, we aim to make every journey not only smooth but spiritually meaningful.
    </p>
  );
}

const ceo = (
  <>
    <span className="font-semibold text-night-900">Hafiz M. Nouman Aziz</span> — CEO, Bin Aziz
  </>
);

/**
 * `immersive` = the 3D layout: 300vh tall with the copy pinned on the left
 * while the 3D ticket turns, prints its details and flips into the hotel voucher on the right.
 */
export function Intro({ immersive = false }: { immersive?: boolean }) {
  if (immersive) {
    return (
      <section className="relative h-[300vh] bg-ivory-50" aria-labelledby="intro-title">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-night-950 to-transparent opacity-90" />
        <div className="sticky top-0 flex h-dvh items-center overflow-hidden max-md:items-end">
          <div className="absolute top-1/2 -right-40 size-[560px] -translate-y-1/2 rounded-full bg-gold-300/25 blur-3xl" aria-hidden />
          <div className="container-page relative z-20 grid md:grid-cols-2">
            <div className="max-md:pb-14">
              <Heading />
              <Lead className="mt-6 max-w-lg text-base leading-relaxed text-ink/70 md:text-lg" />
              <ul className="mt-9 grid max-w-lg grid-cols-3 gap-3">
                {values.map((v) => (
                  <li key={v.word} className="rounded-2xl border border-gold-500/25 bg-white/60 px-4 py-5 text-center backdrop-blur">
                    <span className="block font-arabic text-2xl text-gold-600" lang="ar">
                      {v.arabic}
                    </span>
                    <span className="mt-2 block font-display text-xl text-night-900">{v.word}</span>
                    <span className="block text-[11px] tracking-widest text-ink/50 uppercase">{v.meaning}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-sm text-ink/60">{ceo}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-ivory-50 py-24 md:py-32" aria-labelledby="intro-title">
      <div className="container-page grid items-center gap-14 lg:grid-cols-2">
        <div>
          <Heading />
          <Lead className="mt-6 max-w-lg text-base leading-relaxed text-ink/70 md:text-lg" />
          <p className="mt-8 text-sm text-ink/60">{ceo}</p>
        </div>

        <Reveal as="ul" stagger className="grid gap-4 sm:grid-cols-3">
          {values.map((v) => (
            <li key={v.word} className="rounded-3xl border border-gold-500/25 bg-white px-5 py-8 text-center">
              <span className="block font-arabic text-3xl text-gold-600" lang="ar">
                {v.arabic}
              </span>
              <span className="mt-3 block font-display text-2xl text-night-900">{v.word}</span>
              <span className="mt-1 block text-[11px] tracking-widest text-ink/50 uppercase">{v.meaning}</span>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
