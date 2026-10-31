"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { fleet, type VehicleId } from "@/lib/fleet";
import { Spin360 } from "./Spin360";

const FleetScene = dynamic(() => import("@/components/three/fleet/FleetScene"), {
  ssr: false,
  loading: () => <StageFallback />,
});

function StageFallback() {
  return (
    <div className="grid h-full place-items-center">
      <span className="size-10 animate-spin rounded-full border-2 border-gold-500/30 border-t-gold-400" />
    </div>
  );
}

/** The 3D fleet (shown when the admin's 3D switch is on); `Fleet` is the plain cards version. */
export function FleetShowcase() {
  const ref = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState<VehicleId>("hiace");
  const [near, setNear] = useState(false); // load the 3D chunk only when the section approaches
  const [visible, setVisible] = useState(false); // render frames only while on screen
  const vehicle = fleet.find((v) => v.id === selected)!;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        if (e.isIntersecting) setNear(true);
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} id="fleet" className="relative scroll-mt-20 overflow-hidden bg-night-950 py-24 text-ivory-50 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgb(36_50_99/0.7),transparent_65%)]" />
      <div className="container-page relative">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">
              <span className="h-px w-8 bg-current" /> Our fleet
            </p>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] font-medium md:text-6xl">
              From the runway <span className="text-gold-gradient italic">to the Haram.</span>
            </h2>
          </div>
          <p className="max-w-sm text-ivory-100/60">Drag to rotate, scroll to zoom. Choose a vehicle to see how we move our guests.</p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="relative h-[420px] overflow-hidden rounded-[2rem] border border-gold-500/15 bg-night-900/40 md:h-[560px]">
            {near ? <FleetScene selected={selected} active={visible && !vehicle.spin} /> : <StageFallback />}
            <div className="pointer-events-none absolute top-5 left-6 text-[10px] tracking-[0.35em] text-ivory-100/40 uppercase">Interactive 3D</div>
            {/* vehicles with real photos get the photo 360° viewer instead of the 3D model */}
            {vehicle.spin && (
              <div key={vehicle.id} className="absolute inset-0 z-10 motion-safe:animate-[fadeUp_0.6s_ease-out]">
                <Spin360 frames={vehicle.spin} name={vehicle.name} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div role="tablist" aria-label="Choose a vehicle" className="grid grid-cols-2 gap-2">
              {fleet.map((v) => (
                <button
                  key={v.id}
                  role="tab"
                  aria-selected={v.id === selected}
                  onClick={() => setSelected(v.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    v.id === selected ? "border-gold-400 bg-gold-500 text-night-950" : "border-ivory-100/15 text-ivory-100/75 hover:border-gold-500/50"
                  }`}
                >
                  <span className="block text-[10px] tracking-widest uppercase opacity-70">{v.category}</span>
                  <span className="mt-0.5 block font-semibold">{v.name}</span>
                </button>
              ))}
            </div>

            <div key={vehicle.id} className="glass-dark flex-1 rounded-[2rem] p-7 motion-safe:animate-[fadeUp_0.6s_ease-out]">
              <p className="text-xs tracking-[0.25em] text-gold-400 uppercase">{vehicle.capacity}</p>
              <h3 className="mt-3 font-display text-4xl">{vehicle.name}</h3>
              <p className="mt-4 text-ivory-100/65">{vehicle.text}</p>
              <ul className="mt-6 space-y-3">
                {vehicle.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <span className="grid size-6 place-items-center rounded-full bg-gold-500/15 text-gold-400">
                      <Icon name="check" className="size-3.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
