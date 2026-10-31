import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const pillars = [
  { icon: "shield", title: "Riba-free dealings", text: "Transparent, interest-free financial practices in every transaction." },
  { icon: "kaaba", title: "Halal-friendly stays", text: "Accommodation and conduct curated around Islamic principles." },
  { icon: "heart", title: "Adab in service", text: "Staff trained in Islamic etiquette and Sunnah-based client care." },
] as const;

export function Principles() {
  return (
    <section className="bg-ivory-100 py-24 md:py-32">
      <div className="container-page grid items-center gap-16 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Our motive"
            title={
              <>
                We don’t sell packages — we offer <span className="italic text-gold-600">peace of mind.</span>
              </>
            }
            text="To serve the Muslim Ummah by removing travel-related hardships and replacing them with comfort, spiritual guidance and convenience throughout their journey."
          />
          <div className="mt-10">
            <Button href="/about" variant="dark">
              Read our story
            </Button>
          </div>
        </div>
        <Reveal stagger className="grid gap-4">
          {pillars.map((p) => (
            <div key={p.title} className="flex gap-5 rounded-3xl border border-gold-500/20 bg-ivory-50 p-6 md:p-8">
              <span className="grid size-14 shrink-0 place-items-center rounded-full border border-gold-500/40 text-gold-600">
                <Icon name={p.icon} className="size-6" />
              </span>
              <div>
                <h3 className="font-display text-2xl text-night-900">{p.title}</h3>
                <p className="mt-1.5 text-ink/65">{p.text}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
