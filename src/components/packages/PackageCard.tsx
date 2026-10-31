import Link from "next/link";
import { Icon } from "@/components/icons";
import type { PackageTeaser } from "@/lib/packages";

export function PackageCard({ pkg, signedIn, price }: { pkg: PackageTeaser; signedIn: boolean; price?: string | null }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[2rem] border border-gold-500/20 bg-white transition-[translate,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgb(10_17_40/0.35)]">
      <div className="relative h-52 overflow-hidden bg-night-900">
        {pkg.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- covers are arbitrary URLs pasted in Supabase
          <img src={pkg.cover_url} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="bg-islamic-pattern grid size-full place-items-center">
            <Icon name="kaaba" className="size-16 text-gold-500/60" />
          </div>
        )}
        <span className="absolute top-4 left-4 rounded-full bg-gold-500 px-3 py-1 text-[11px] font-bold tracking-widest text-night-950 uppercase">
          {pkg.tier}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-7">
        <p className="text-xs tracking-[0.2em] text-gold-600 uppercase">
          {pkg.category}
          {pkg.duration_days ? ` · ${pkg.duration_days} days` : ""}
        </p>
        <h3 className="mt-2 font-display text-3xl text-night-900">{pkg.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-ink/65">{pkg.teaser}</p>

        <div className="mt-auto pt-6">
          {signedIn ? (
            <div className="flex items-end justify-between gap-4 border-t border-night-900/10 pt-5">
              <div>
                <p className="text-[11px] tracking-widest text-ink/45 uppercase">Price</p>
                <p className="font-semibold text-night-900">{price || "On request"}</p>
              </div>
              <Link href={`/packages/${pkg.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-gold-600 hover:text-gold-500">
                Full details <Icon name="arrow" className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-ivory-100 p-4">
              <p className="flex items-center gap-2 text-sm text-ink/70">
                <Icon name="shield" className="size-4 text-gold-600" /> Price, hotels & itinerary for members
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(`/packages/${pkg.slug}`)}`}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-night-900 px-5 py-2.5 text-sm font-semibold text-ivory-50 transition hover:bg-night-700"
              >
                Sign up free to unlock
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
