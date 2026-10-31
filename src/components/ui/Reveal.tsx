"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  /** Animate direct children one after another instead of the wrapper. */
  stagger?: boolean;
};

export function Reveal({ children, as: Tag = "div", className, delay = 0, stagger = false }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const targets = stagger ? Array.from(el.children) : el;
      gsap.from(targets, {
        y: 40,
        opacity: 0,
        duration: 1,
        delay,
        ease: "power3.out",
        stagger: stagger ? 0.12 : 0,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
