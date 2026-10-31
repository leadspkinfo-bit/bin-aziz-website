import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CallToAction } from "@/components/home/CallToAction";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { services } from "@/lib/content";
import { whatsappLink } from "@/lib/site";
import { requirePage } from "@/lib/settings";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  return service ? { title: service.title, description: service.short } : {};
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  await requirePage("page_services");
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();
  const others = services.filter((s) => s.slug !== slug);

  return (
    <>
      <PageHero eyebrow="Our services" title={service.title} text={service.intro} />

      <section className="bg-ivory-50 py-24 md:py-32">
        <div className="container-page grid gap-14 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="font-display text-4xl text-night-900 md:text-5xl">What’s included</h2>
            <Reveal as="ul" stagger className="mt-10 grid gap-4 sm:grid-cols-2">
              {service.features.map((f) => (
                <li key={f} className="flex gap-4 rounded-2xl border border-gold-500/20 bg-white p-5 text-ink/80">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gold-500/15 text-gold-600">
                    <Icon name="check" className="size-4" />
                  </span>
                  {f}
                </li>
              ))}
            </Reveal>

            <h2 className="mt-20 font-display text-4xl text-night-900 md:text-5xl">How it works</h2>
            <ol className="mt-10 grid gap-6 sm:grid-cols-2">
              {service.steps.map((step, i) => (
                <li key={step} className="relative border-l border-gold-500/40 pl-6">
                  <span className="font-display text-5xl text-gold-500/70">0{i + 1}</span>
                  <p className="mt-2 font-medium text-night-900">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative overflow-hidden rounded-[2rem] bg-night-900 p-8 text-ivory-50 md:p-10">
              <div className="bg-islamic-pattern absolute inset-0" aria-hidden />
              <div className="relative">
                <Icon name={service.icon} className="size-10 text-gold-400" />
                <h3 className="mt-6 font-display text-3xl">Plan your {service.title.toLowerCase()}</h3>
                <p className="mt-3 text-ivory-100/65">
                  Tell us what you need and our team will reply with options — usually the same day.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  <Button href={`/contact?service=${service.slug}`}>Send an inquiry</Button>
                  <Button href={whatsappLink(`Assalam o Alaikum, I would like details about ${service.title}.`)} external variant="outline" arrow={false}>
                    <Icon name="whatsapp" className="size-4" /> Ask on WhatsApp
                  </Button>
                </div>
              </div>
            </div>
            <nav className="mt-8" aria-label="Other services">
              <p className="text-xs font-semibold tracking-[0.3em] text-gold-600 uppercase">Other services</p>
              <ul className="mt-4 divide-y divide-night-900/10">
                {others.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/services/${o.slug}`} className="group flex items-center justify-between py-4 text-night-900 transition hover:text-gold-600">
                      <span className="font-display text-xl">{o.title}</span>
                      <Icon name="arrow" className="size-4 transition group-hover:translate-x-1" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </section>

      <div className="bg-ivory-100 pt-24 md:pt-32">
        <CallToAction />
      </div>
    </>
  );
}
