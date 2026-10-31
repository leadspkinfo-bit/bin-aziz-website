import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons";
import { whatsappLink } from "@/lib/site";

// Deterministic star field so server and client markup match.
const stars = Array.from({ length: 70 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 127.1 + n * 311.7) * 43758.5453) % 1 + 1) % 1;
  return { left: r(1) * 100, top: r(2) * 75, size: 1 + r(3) * 2, delay: r(4) * 4 };
});

/**
 * `immersive` = the 3D layout: full-screen, copy on the left, right side left
 * free for the floating 3D ticket. Otherwise the plain centred layout.
 */
export function Hero({ immersive = false }: { immersive?: boolean }) {
  return (
    <section
      className={`relative overflow-hidden bg-night-950 text-ivory-50 ${
        // min-h (not h) so short or zoomed screens grow the section instead of clipping it
        immersive ? "flex min-h-dvh items-center pt-28 pb-24 md:pt-32" : "pt-40 pb-28 md:pt-52 md:pb-36"
      }`}
    >
      <div
        className={`absolute inset-0 ${
          immersive
            ? "bg-[radial-gradient(ellipse_at_75%_40%,rgb(36_50_99/0.9),transparent_60%),radial-gradient(ellipse_at_10%_100%,rgb(201_163_91/0.16),transparent_55%)]"
            : "bg-[radial-gradient(ellipse_at_50%_30%,rgb(36_50_99/0.9),transparent_60%),radial-gradient(ellipse_at_10%_100%,rgb(201_163_91/0.16),transparent_55%)]"
        }`}
      />
      <div className="bg-islamic-pattern absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]" />
      <div className="absolute inset-0" aria-hidden>
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute animate-twinkle rounded-full bg-ivory-50"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
          />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-night-950" />

      <div className={`container-page relative ${immersive ? "z-20 max-md:self-start" : ""}`}>
        <div className={immersive ? "max-w-xl" : "mx-auto max-w-3xl text-center"}>
          <p className="font-arabic text-2xl text-gold-400 md:text-3xl" lang="ar" dir="rtl">
            لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ
          </p>
          <h1
            className={`mt-5 font-display text-5xl leading-[0.98] font-medium sm:text-6xl lg:text-[5.5rem] ${
              immersive ? "[@media(max-height:820px)]:lg:text-7xl" : ""
            }`}
          >
            Your sacred journey,
            <br />
            <span className="text-gold-gradient italic">our Amanah.</span>
          </h1>
          <p className={`mt-7 text-base leading-relaxed text-ivory-100/70 md:text-lg ${immersive ? "max-w-md" : "mx-auto max-w-xl"}`}>
            IATA licensed Umrah, worldwide ticketing and visa services from Lahore — arranged with khidmat,
            amanah and ikhlaas.
          </p>
          <div className={`mt-9 flex flex-wrap gap-4 ${immersive ? "" : "justify-center"}`}>
            <Button href="/packages">View Packages</Button>
            <Button href={whatsappLink()} external variant="outline" arrow={false}>
              <Icon name="whatsapp" className="size-4" /> Talk to us
            </Button>
          </div>
          <dl
            className={`hidden border-t border-ivory-100/10 sm:flex ${
              immersive ? "mt-12 gap-10 pt-6" : "mt-14 justify-center gap-14 pt-8"
            }`}
          >
            {[
              ["10,000+", "Umrah pilgrims"],
              ["IATA", "Licensed company"],
              ["100%", "Shariah-compliant"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-3xl text-gold-300">{v}</dd>
                <dd className="mt-1 text-xs tracking-widest text-ivory-100/50 uppercase">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {immersive && (
        <div className="absolute bottom-8 left-1/2 z-0 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] tracking-[0.35em] text-ivory-100/50 uppercase md:flex">
          Scroll
          <span className="h-10 w-px animate-pulse bg-gradient-to-b from-gold-400 to-transparent" />
        </div>
      )}
    </section>
  );
}
