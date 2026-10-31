import type { Metadata } from "next";
import Image from "next/image";
import { CallToAction } from "@/components/home/CallToAction";
import { Icon } from "@/components/icons";
import { PageHero } from "@/components/ui/PageHero";
import { withHonorific } from "@/components/ui/Honorific";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Gallery } from "@/components/about/Gallery";
import { gallery, leaders, shariahPolicies, staffEthics, values } from "@/lib/content";
import { requirePage } from "@/lib/settings";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Our story, mission and vision, leadership messages and the Shariah-compliant principles behind Bin Aziz Tourism.",
};

export default async function AboutPage() {
  await requirePage("page_about");
  return (
    <>
      <PageHero
        arabic="وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ"
        eyebrow="Our story"
        title={
          <>
            Where professionalism <span className="text-gold-gradient italic">meets spirituality.</span>
          </>
        }
        text="Bin Aziz Tourism & Consultant Pvt. Ltd. has proudly served thousands of pilgrims and travellers with integrity, spiritual care and professional excellence."
      />

      {/* Mission & vision */}
      <section className="bg-ivory-50 py-24 md:py-32">
        <div className="container-page">
          <Reveal stagger className="grid gap-6 md:grid-cols-2">
            {[
              {
                k: "Mission",
                q: "To provide ease and peace of mind to every pilgrim, ensuring their spiritual journey is filled with comfort, trust, and barakah.",
              },
              {
                k: "Vision",
                q: "To be globally recognized as the most ethical and reliable Islamic tourism provider, facilitating sacred journeys with sincerity and professionalism.",
              },
            ].map((b, i) => (
              <figure
                key={b.k}
                className={`relative overflow-hidden rounded-[2rem] p-10 md:p-14 ${
                  i === 0 ? "bg-night-900 text-ivory-50" : "border border-gold-500/25 bg-ivory-100 text-night-900"
                }`}
              >
                {i === 0 && <div className="bg-islamic-pattern absolute inset-0" aria-hidden />}
                <p className={`relative text-xs font-semibold tracking-[0.3em] uppercase ${i === 0 ? "text-gold-400" : "text-gold-600"}`}>
                  Our {b.k}
                </p>
                <blockquote className="relative mt-6 font-display text-3xl leading-snug md:text-4xl">“{b.q}”</blockquote>
              </figure>
            ))}
          </Reveal>

          <div className="mt-24 grid items-start gap-14 lg:grid-cols-[1fr_1.2fr]">
            <SectionHeading
              eyebrow="Our philosophy"
              title={
                <>
                  Three words guide <span className="italic text-gold-600">every journey.</span>
                </>
              }
              text="From organising Umrah journeys to worldwide ticketing and visa services, our reputation is built on trust and reliability. We have signed multiple MOUs with leading service providers and established strong B2B networks."
            />
            <Reveal stagger className="grid gap-4 sm:grid-cols-3">
              {values.map((v) => (
                <div key={v.word} className="rounded-3xl border border-gold-500/25 bg-white p-8 text-center">
                  <span className="block font-arabic text-4xl text-gold-600" lang="ar">
                    {v.arabic}
                  </span>
                  <span className="mt-4 block font-display text-3xl text-night-900">{v.word}</span>
                  <span className="mt-1 block text-xs tracking-widest text-ink/50 uppercase">{v.meaning}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Leadership — one row per leader, portrait alternating sides */}
      <section className="relative overflow-hidden bg-night-900 py-24 text-ivory-50 md:py-32">
        <div className="bg-islamic-pattern absolute inset-0" aria-hidden />
        <div className="container-page relative">
          <SectionHeading tone="dark" align="center" eyebrow="Leadership" title={<>Messages from our <span className="text-gold-gradient italic">leadership</span></>} />
          <div className="mt-16 space-y-20 md:mt-24 md:space-y-32">
            {leaders.map((l, i) => (
              <Reveal
                key={l.role}
                as="article"
                stagger
                className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20"
              >
                <div className={`relative mx-auto w-full max-w-sm lg:max-w-none ${i % 2 ? "lg:order-2" : ""}`}>
                  {/* offset gold frame behind the portrait */}
                  <div
                    className={`absolute inset-0 translate-y-4 rounded-[2rem] border border-gold-500/40 ${i % 2 ? "-translate-x-4" : "translate-x-4"}`}
                    aria-hidden
                  />
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-night-950 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8)]">
                    <Image
                      src={l.photo}
                      alt={l.name ? `${l.name}, ${l.role}` : `${l.role}, Bin Aziz Tourism`}
                      fill
                      sizes="(min-width: 1280px) 500px, (min-width: 1024px) 40vw, (min-width: 640px) 384px, 100vw"
                      quality={92}
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night-950/80 to-transparent" aria-hidden />
                    <span className="absolute bottom-5 left-6 font-display text-5xl text-gold-300/90">0{i + 1}</span>
                  </div>
                </div>

                <figure>
                  <p className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">
                    <span className="h-px w-8 bg-current" /> {l.name ? l.role : "Message from the"}
                  </p>
                  <h3 className="mt-4 font-display text-4xl md:text-5xl">{l.name ?? l.role}</h3>
                  <span className="mt-8 block font-display text-7xl leading-none text-gold-500/80" aria-hidden>
                    “
                  </span>
                  <blockquote className="-mt-6 font-display text-2xl leading-snug text-ivory-50/90 md:text-3xl">
                    {withHonorific(l.quote)}
                  </blockquote>
                  <figcaption className="mt-8 flex items-center gap-4 border-t border-ivory-100/10 pt-6 text-sm tracking-wide">
                    <span className="h-px w-10 bg-gold-500" aria-hidden />
                    <span>
                      {l.name && <span className="font-semibold">{l.name} · </span>}
                      <span className="text-gold-400">
                        {l.role}, Bin Aziz Tourism
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="overflow-hidden bg-ivory-50 py-24 md:py-32" aria-labelledby="gallery-title">
        <div className="container-page flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div id="gallery-title">
            <SectionHeading
              eyebrow="Gallery"
              title={
                <>
                  Moments from <span className="italic text-gold-600">our journey.</span>
                </>
              }
            />
          </div>
          <p className="max-w-sm text-ink/65">
            Guests, partners, new branches and celebrations — a look at the people behind Bin Aziz. Tap any photo to view it in full.
          </p>
        </div>
        <Reveal className="mt-14 md:mt-16">
          <Gallery photos={gallery} />
        </Reveal>
      </section>

      {/* Motive */}
      <section className="bg-ivory-100 py-24 md:py-32">
        <div className="container-page">
          <figure className="mx-auto max-w-4xl text-center">
            <span className="font-display text-8xl leading-none text-gold-500">“</span>
            <blockquote className="-mt-6 font-display text-3xl leading-snug text-night-900 md:text-5xl">
              To serve the Muslim Ummah by removing travel-related hardships and replacing them with comfort, spiritual
              guidance, and convenience. We don’t sell packages —{" "}
              <span className="italic text-gold-600">we offer peace of mind and faithful companionship.</span>
            </blockquote>
            <figcaption className="mt-8 text-sm tracking-wide text-ink/60">
              <span className="font-semibold text-night-900">Hafiz M. Nouman Aziz</span> — CEO, Bin Aziz Tourism
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Shariah policies & staff ethics */}
      <section className="bg-ivory-50 py-24 md:py-32">
        <div className="container-page">
          <SectionHeading
            align="center"
            eyebrow="Additional information"
            title={
              <>
                A mission of service <span className="italic text-gold-600">rooted in Islamic values.</span>
              </>
            }
          />
          <Reveal stagger className="mt-16 grid gap-6 lg:grid-cols-2">
            {[
              { title: "Shariah-compliant policies", icon: "shield" as const, items: shariahPolicies },
              { title: "Staff trained in Islamic ethics", icon: "heart" as const, items: staffEthics },
            ].map((b) => (
              <div key={b.title} className="overflow-hidden rounded-[2rem] border border-gold-500/25 bg-white">
                <div className="flex items-center gap-4 bg-night-900 px-8 py-6 text-ivory-50">
                  <Icon name={b.icon} className="size-7 text-gold-400" />
                  <h3 className="font-display text-3xl">{b.title}</h3>
                </div>
                <ul className="space-y-5 p-8">
                  {b.items.map((t) => (
                    <li key={t} className="flex gap-4 text-ink/75">
                      <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-gold-500/15 text-gold-600">
                        <Icon name="check" className="size-3.5" />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <div className="bg-ivory-100 pt-24 md:pt-32">
        <CallToAction />
      </div>
    </>
  );
}
