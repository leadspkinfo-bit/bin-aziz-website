import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Honorific } from "@/components/ui/Honorific";
import { services } from "@/lib/content";
import { nav, site } from "@/lib/site";
import logo from "../../../public/brand/logo-ivory.png";

export function Footer({ hiddenHrefs = [] }: { hiddenHrefs?: string[] }) {
  const links = nav.filter((item) => !hiddenHrefs.includes(item.href));
  const showServices = !hiddenHrefs.includes("/services");
  return (
    <footer className="relative overflow-hidden bg-night-950 text-ivory-100/75">
      <div className="bg-islamic-pattern absolute inset-0 opacity-60" aria-hidden />
      <div className="container-page relative grid gap-12 py-20 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <Image src={logo} alt={site.legalName} className="h-14 w-auto" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed">
            A faith-driven, Shariah-compliant travel company committed to serving the guests of Allah <Honorific /> with
            khidmat, amanah and ikhlaas.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-500/30 px-4 py-1.5 text-xs tracking-widest text-gold-400 uppercase">
            <Icon name="badge" className="size-4" /> IATA Licensed
          </p>
        </div>

        <div>
          <h3 className="font-display text-xl text-ivory-50">Explore</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {links.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-gold-400">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {showServices && (
          <div>
            <h3 className="font-display text-xl text-ivory-50">Services</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`} className="transition hover:text-gold-400">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="font-display text-xl text-ivory-50">Visit our office</h3>
          <address className="mt-5 space-y-4 text-sm not-italic">
            <p className="flex gap-3">
              <Icon name="pin" className="mt-0.5 size-5 shrink-0 text-gold-500" />
              <span>{site.address.lines.join(", ")}</span>
            </p>
            {site.phones.map((p) => (
              <a key={p.href} href={p.href} className="flex gap-3 transition hover:text-gold-400">
                <Icon name="phone" className="size-5 shrink-0 text-gold-500" />
                {p.label}
              </a>
            ))}
            <a href={`mailto:${site.email}`} className="flex gap-3 transition hover:text-gold-400">
              <Icon name="mail" className="size-5 shrink-0 text-gold-500" />
              {site.email}
            </a>
          </address>
        </div>
      </div>

      <div className="relative border-t border-ivory-100/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-ivory-100/50 sm:flex-row">
          <p>© {site.legalName}. All rights reserved.</p>
          <p className="font-arabic text-base text-gold-500/80" lang="ar" dir="rtl">
            خدمت · أمانة · إخلاص
          </p>
        </div>
      </div>
    </footer>
  );
}
