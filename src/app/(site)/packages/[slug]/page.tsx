import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { getPackage, type PackageDetails } from "@/lib/packages";
import { whatsappLink } from "@/lib/site";
import { requirePage } from "@/lib/settings";

export const metadata: Metadata = { title: "Package details" };

function Details({ details }: { details: PackageDetails | null }) {
  if (!details) return <p className="text-ink/65">Full details for this package will be added soon — please ask us on WhatsApp.</p>;
  const facts = [
    ["Price", details.price_text],
    ["Makkah hotel", details.makkah_hotel],
    ["Madinah hotel", details.madinah_hotel],
  ].filter(([, v]) => v);

  return (
    <div className="space-y-10">
      {facts.length > 0 && (
        <dl className="grid gap-4 sm:grid-cols-3">
          {facts.map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-gold-500/20 bg-white p-5">
              <dt className="text-[11px] tracking-widest text-ink/45 uppercase">{k}</dt>
              <dd className="mt-1 font-semibold text-night-900">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {details.inclusions.length > 0 && (
        <div>
          <h2 className="font-display text-3xl text-night-900">What’s included</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {details.inclusions.map((item) => (
              <li key={item} className="flex gap-3 text-ink/80">
                <Icon name="check" className="mt-0.5 size-5 shrink-0 text-gold-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {details.itinerary && (
        <div>
          <h2 className="font-display text-3xl text-night-900">Itinerary</h2>
          <p className="mt-4 whitespace-pre-line text-ink/75">{details.itinerary}</p>
        </div>
      )}
      {details.notes && <p className="rounded-2xl bg-ivory-100 p-5 text-sm whitespace-pre-line text-ink/70">{details.notes}</p>}
    </div>
  );
}

function Locked({ slug }: { slug: string }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-gold-500/25 bg-white">
      {/* Placeholder rows behind the blur — no real data is sent to visitors. */}
      <div className="space-y-4 p-8 blur-sm select-none" aria-hidden>
        {[70, 90, 55, 80, 65].map((w, i) => (
          <div key={i} className="h-5 rounded-full bg-ivory-200" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="absolute inset-0 grid place-items-center bg-white/60 p-6 text-center">
        <div className="max-w-sm">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-night-900 text-gold-400">
            <Icon name="shield" className="size-6" />
          </span>
          <h2 className="mt-4 font-display text-3xl text-night-900">Sign up to see full details</h2>
          <p className="mt-2 mb-6 text-sm text-ink/65">Price, hotels, inclusions and itinerary are free for members.</p>
          <GoogleButton next={`/packages/${slug}`} label="Sign up with Google" />
          <Link
            href={`/login?next=${encodeURIComponent(`/packages/${slug}`)}`}
            className="mt-4 inline-block text-sm font-semibold text-gold-600 hover:text-gold-500"
          >
            or sign up with email →
          </Link>
        </div>
      </div>
    </div>
  );
}

async function PackageView({ params }: { params: PageProps<"/packages/[slug]">["params"] }) {
  const { slug } = await params;
  const { signedIn, pkg, details } = await getPackage(slug);
  if (!pkg) notFound();

  return (
    <>
      <section className="relative overflow-hidden bg-night-950 pt-40 pb-20 text-ivory-50 md:pt-48">
        <div className="bg-islamic-pattern absolute inset-0" aria-hidden />
        <div className="container-page relative">
          <Link href="/packages" className="text-sm text-ivory-100/60 transition hover:text-gold-400">
            ← All packages
          </Link>
          <p className="mt-6 text-xs tracking-[0.3em] text-gold-400 uppercase">
            {pkg.tier} · {pkg.category}
            {pkg.duration_days ? ` · ${pkg.duration_days} days` : ""}
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[1.02] font-medium md:text-7xl">{pkg.title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-ivory-100/70">{pkg.teaser}</p>
        </div>
      </section>
      <section className="bg-ivory-50 py-20">
        <div className="container-page grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div>{signedIn ? <Details details={details} /> : <Locked slug={pkg.slug} />}</div>
          <aside className="h-fit rounded-[2rem] bg-night-900 p-8 text-ivory-50">
            <h2 className="font-display text-3xl">Book this package</h2>
            <p className="mt-3 text-ivory-100/65">Our team will confirm availability and help you choose dates.</p>
            <div className="mt-6 flex flex-col gap-3">
              <Button href={whatsappLink(`Assalam o Alaikum, I am interested in "${pkg.title}".`)} external>
                Book on WhatsApp
              </Button>
              <Button href="/contact?service=umrah" variant="outline">
                Send an inquiry
              </Button>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

export default async function PackagePage({ params }: PageProps<"/packages/[slug]">) {
  await requirePage("page_packages");
  return (
    <Suspense fallback={<div className="min-h-dvh bg-night-950" />}>
      <PackageView params={params} />
    </Suspense>
  );
}
