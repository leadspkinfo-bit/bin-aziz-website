"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { TicketTimeline } from "@/components/three/ticket/TicketScene";

// three.js only runs in the browser and is heavy, so it loads in its own chunk after hydration.
const TicketScene = dynamic(() => import("@/components/three/ticket/TicketScene"), { ssr: false });

/**
 * Wraps the immersive hero and intro. A sticky full-screen canvas sits above
 * their backgrounds; one scrubbed GSAP timeline maps scroll progress across
 * both sections to the ticket's path, rotation and printed details.
 *
 * Scroll budget in viewport heights (track = 100vh hero + 300vh intro, so 300vh of scrolling):
 *   0.00 – 1.00  travel along the sine wave while the hero leaves
 *   0.80 – 1.36  rotate vertical → horizontal as the intro arrives
 *   1.36 – 1.70  details fade in on the ticket face
 *   1.70 – 1.90  hold so the ticket can be read
 *   1.90 – 2.60  two bottom-to-top turns; the ticket becomes the 5-star hotel voucher
 *   2.50 – 2.80  stay details fade in on the voucher
 *   2.80 – 3.00  hold
 *
 * `withServices` adds the services section (200vh) to the track, so 500vh of scrolling:
 *   2.95 – 3.25  the voucher stands vertical again as the intro leaves
 *   2.95 – 3.95  it rides a sine wave down while the services arrive
 *   3.75 – 4.20  vertical → horizontal beside the services copy
 *   4.15 – 4.50  the service cards fan out behind it (then they cycle on their own)
 *   4.50 – 5.00  hold
 *
 * `withIntro={false}` (intro switched off): only the hero is inside, so the
 * ticket rides the sine wave while the hero scrolls away and stays vertical.
 */
export function TicketJourney({
  children,
  withIntro = true,
  withServices = false,
}: {
  children: ReactNode;
  withIntro?: boolean;
  withServices?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const timeline = useRef<TicketTimeline>({ travel: 0, turn: 0, details: 0, flip: 0, voucher: 0, lift: 0, fall: 0, land: 0, stack: 0 });
  const [active, setActive] = useState(false);

  useGSAP(
    () => {
      const state = timeline.current;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: track.current,
          start: "top top",
          end: withIntro ? "bottom bottom" : "bottom top",
          scrub: reduced ? true : 0.8,
        },
      });
      if (withIntro) {
        tl.to(state, { travel: 1, duration: 1 }, 0)
          .to(state, { turn: 1, duration: 0.56, ease: "power2.inOut" }, 0.8)
          .to(state, { details: 1, duration: 0.34 }, 1.36)
          .to(state, { flip: 1, duration: 0.7, ease: "power1.inOut" }, 1.9)
          .to(state, { voucher: 1, duration: 0.3 }, 2.5);
        if (withServices) {
          tl.to(state, { lift: 1, duration: 0.3, ease: "power2.inOut" }, 2.95)
            .to(state, { fall: 1, duration: 1 }, 2.95)
            .to(state, { land: 1, duration: 0.45, ease: "power2.inOut" }, 3.75)
            .to(state, { stack: 1, duration: 0.35, ease: "power2.out" }, 4.15)
            .to({}, { duration: 0.5 });
        } else {
          tl.to({}, { duration: 0.2 });
        }
      } else {
        tl.to(state, { travel: 1, duration: 1 }, 0);
      }
    },
    { scope: track, dependencies: [withIntro, withServices] },
  );

  // Only render frames while the journey is on screen.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={track} className="relative">
      <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
        <div className="sticky top-0 h-dvh w-full">
          <TicketScene timeline={timeline} active={active} />
        </div>
      </div>
      {children}
    </div>
  );
}
