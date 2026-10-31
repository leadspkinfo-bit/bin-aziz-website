import Link from "next/link";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { airlines, services } from "@/lib/content";

const heading = (
  <>
    Every journey, <span className="italic text-gold-600">handled with care.</span>
  </>
);
const lead = "From the first visa document to the last ziyarat — one trusted team, one point of contact.";

function ServiceCard({ s, i, compact = false }: { s: (typeof services)[number]; i: number; compact?: boolean }) {
  return (
    <Link
      href={`/services/${s.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-night-900/8 bg-white shadow-[0_1px_0_rgb(0_0_0/0.03)] transition-[translate,border-color,box-shadow] duration-500 hover:-translate-y-1 hover:border-gold-500/40 hover:shadow-[0_30px_60px_-30px_rgb(10_17_40/0.35)] ${
        compact ? "p-5 md:min-h-60 md:p-7" : "min-h-72 p-8"
      }`}
    >
      <div className="absolute inset-0 bg-night-900 opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="bg-islamic-pattern absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between">
        <span
          className={`grid place-items-center rounded-2xl bg-gold-500/12 text-gold-600 transition duration-500 group-hover:bg-gold-500 group-hover:text-night-950 ${
            compact ? "size-11 md:size-14" : "size-14"
          }`}
        >
          <Icon name={s.icon} className={compact ? "size-6 md:size-7" : "size-7"} />
        </span>
        <span className="font-display text-lg text-ink/25 transition group-hover:text-gold-400/60">0{i + 1}</span>
      </div>
      <h3
        className={`relative mt-auto font-display text-night-900 transition duration-500 group-hover:text-ivory-50 ${
          compact ? "pt-5 text-xl md:pt-8 md:text-2xl" : "pt-10 text-3xl"
        }`}
      >
        {s.title}
      </h3>
      <p
        className={`relative mt-3 text-sm leading-relaxed text-ink/60 transition duration-500 group-hover:text-ivory-100/70 ${
          compact ? "max-md:hidden" : ""
        }`}
      >
        {s.short}
      </p>
      <span className="relative mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold-600 transition group-hover:text-gold-400 md:mt-6">
        Learn more <Icon name="arrow" className="size-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function AirlineMarquee({ className = "" }: { className?: string }) {
  return (
    <div className={`border-y border-night-900/8 py-6 ${className}`} aria-label="Airlines we ticket">
      <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex shrink-0 animate-marquee gap-14 pr-14">
          {[...airlines, ...airlines].map((a, i) => (
            <span key={i} className="font-display text-2xl whitespace-nowrap text-night-900/35 italic" aria-hidden={i >= airlines.length}>
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * `immersive` = the 3D layout: 200vh tall with the copy and two services pinned
 * on the left while the stack of 3D travel documents shuffles on the right.
 */
export function ServicesSection({ immersive = false }: { immersive?: boolean }) {
  if (immersive) {
    return (
      <section className="relative h-[200vh] bg-ivory-50" id="services" aria-labelledby="services-title">
        <div className="sticky top-0 flex h-dvh flex-col overflow-hidden pt-20">
          <div className="absolute top-1/2 -right-40 size-[560px] -translate-y-1/2 rounded-full bg-gold-300/25 blur-3xl" aria-hidden />
          <div className="container-page relative z-20 grid flex-1 items-center md:grid-cols-2 max-md:items-end max-md:pb-6">
            <div>
              <div id="services-title">
                <SectionHeading eyebrow="What we offer" title={heading} />
              </div>
              <p className="mt-5 max-w-md text-ink/65 max-md:hidden">{lead}</p>
              <div className="mt-6 grid max-w-xl grid-cols-2 gap-3 md:mt-8 md:gap-4">
                {services.slice(0, 2).map((s, i) => (
                  <ServiceCard key={s.slug} s={s} i={i} compact />
                ))}
              </div>
              <Link
                href="/services"
                className="group mt-5 inline-flex items-center gap-3 text-sm font-semibold tracking-[0.2em] text-night-900 uppercase md:mt-7"
              >
                <span className="h-px w-8 bg-gold-500 transition-[width] duration-500 group-hover:w-14" />
                See more services
                <Icon name="arrow" className="size-4 text-gold-600 transition group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <AirlineMarquee className="relative z-20 max-md:py-4" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-ivory-50 py-24 md:py-32" id="services">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading eyebrow="What we offer" title={heading} />
          <p className="max-w-sm text-ink/65">{lead}</p>
        </div>

        <Reveal stagger className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <ServiceCard key={s.slug} s={s} i={i} />
          ))}
        </Reveal>
      </div>

      <AirlineMarquee className="mt-24" />
    </section>
  );
}
