import type { Metadata } from "next";
import { Suspense } from "react";
import { Icon } from "@/components/icons";
import { PageHero } from "@/components/ui/PageHero";
import { site, whatsappLink } from "@/lib/site";
import { InquiryForm } from "./InquiryForm";
import { requirePage } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Visit our office in PIA Housing Scheme, Lahore, call ${site.phones[0].label} or send us an inquiry.`,
};

export default async function ContactPage() {
  await requirePage("page_contact");
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(site.address.query)}&output=embed`;

  return (
    <>
      <PageHero
        arabic="السَّلَامُ عَلَيْكُمْ"
        eyebrow="Contact us"
        title={
          <>
            Stay in touch <span className="text-gold-gradient italic">with us.</span>
          </>
        }
        text="Share your travel plans and our team will get back to you — or visit us at our Lahore office."
      />

      <section className="bg-ivory-50 py-24 md:py-32">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-4">
            {[
              { icon: "pin" as const, title: "Office", body: site.address.lines.join(", ") },
              { icon: "phone" as const, title: "Phone", links: site.phones.map((p) => ({ label: p.label, href: p.href })) },
              { icon: "mail" as const, title: "Email", links: [{ label: site.email, href: `mailto:${site.email}` }] },
              { icon: "whatsapp" as const, title: "WhatsApp", links: [{ label: "Chat with our team", href: whatsappLink() }] },
            ].map((c) => (
              <div key={c.title} className="flex gap-5 rounded-3xl border border-gold-500/20 bg-white p-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-night-900 text-gold-400">
                  <Icon name={c.icon} className="size-5" />
                </span>
                <div>
                  <h2 className="font-display text-2xl text-night-900">{c.title}</h2>
                  {c.body && <p className="mt-1 text-ink/70">{c.body}</p>}
                  {c.links?.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="mt-1 block text-ink/70 transition hover:text-gold-600"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-display text-4xl text-night-900 md:text-5xl">Send an inquiry</h2>
            <p className="mt-3 mb-8 text-ink/65">Fields marked * are required.</p>
            <Suspense fallback={<div className="min-h-96 rounded-[2rem] border border-gold-500/25 bg-ivory-100/60" />}>
              <InquiryForm />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="bg-ivory-50 pb-24">
        <div className="container-page">
          <div className="overflow-hidden rounded-[2rem] border border-gold-500/25">
            <iframe
              title="Bin Aziz Tourism office location"
              src={mapSrc}
              className="h-[420px] w-full grayscale-[0.4]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}
