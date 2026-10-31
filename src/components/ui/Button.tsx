import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

type Props = {
  href: string;
  children: ReactNode;
  variant?: "gold" | "outline" | "dark";
  external?: boolean;
  arrow?: boolean;
  className?: string;
};

const styles = {
  gold: "bg-gold-500 text-night-950 hover:bg-gold-400 shadow-[0_12px_40px_-12px_rgb(201_163_91/0.7)]",
  outline: "border border-ivory-100/30 text-ivory-50 hover:border-gold-400 hover:text-gold-300",
  dark: "bg-night-900 text-ivory-50 hover:bg-night-700",
};

export function Button({ href, children, variant = "gold", external, arrow = true, className = "" }: Props) {
  const cls = `group inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide transition duration-300 ${styles[variant]} ${className}`;
  const inner = (
    <>
      {children}
      {arrow && <Icon name="arrow" className="size-4 transition-transform duration-300 group-hover:translate-x-1" />}
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
