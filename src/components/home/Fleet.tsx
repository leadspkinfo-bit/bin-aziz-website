import { Icon, type AnyIcon } from "@/components/icons";
import { Reveal } from "@/components/ui/Reveal";
import { fleet, type VehicleId } from "@/lib/fleet";

const icons: Record<VehicleId, AnyIcon> = {
  airplane: "plane",
  hiace: "users",
  staria: "heart",
  sedan: "compass",
};

export function Fleet() {
  return (
    <section id="fleet" className="relative scroll-mt-20 overflow-hidden bg-night-950 py-24 text-ivory-50 md:py-32">
      <div className="bg-islamic-pattern absolute inset-0" aria-hidden />
      <div className="container-page relative">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">
            <span className="h-px w-8 bg-current" /> Our fleet
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.05] font-medium md:text-6xl">
            From the runway <span className="text-gold-gradient italic">to the Haram.</span>
          </h2>
        </div>

        <Reveal stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {fleet.map((v) => (
            <div key={v.id} className="glass-dark flex flex-col rounded-3xl p-7">
              <span className="grid size-12 place-items-center rounded-2xl bg-gold-500/15 text-gold-400">
                <Icon name={icons[v.id]} className="size-6" />
              </span>
              <p className="mt-6 text-[10px] tracking-[0.25em] text-gold-400 uppercase">{v.category}</p>
              <h3 className="mt-2 font-display text-3xl">{v.name}</h3>
              <p className="mt-1 text-sm text-ivory-100/50">{v.capacity}</p>
              <p className="mt-4 text-sm leading-relaxed text-ivory-100/65">{v.text}</p>
              <ul className="mt-6 space-y-2.5 border-t border-ivory-100/10 pt-5">
                {v.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <Icon name="check" className="size-4 text-gold-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
