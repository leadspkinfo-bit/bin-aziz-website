"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { nav } from "@/lib/site";
import { AuthButton } from "./AuthButton";
import logo from "../../../public/brand/logo-ivory.png";

type NavItem = (typeof nav)[number];

function DesktopNav({ items, pathname }: { items: NavItem[]; pathname: string | null }) {
  return (
    <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
      {items.map((item) => {
        const active = pathname !== null && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative text-sm tracking-wide transition-colors ${
              active ? "text-gold-400" : "text-ivory-100/80 hover:text-ivory-50"
            }`}
          >
            {item.label}
            {active && <span className="absolute -bottom-1.5 left-0 h-px w-full bg-gold-500" />}
          </Link>
        );
      })}
    </nav>
  );
}

// The current path is request data on dynamic routes, so it streams in behind <Suspense>.
function ActiveDesktopNav({ items }: { items: NavItem[] }) {
  return <DesktopNav items={items} pathname={usePathname()} />;
}

/** `hiddenHrefs`: pages the admin has switched off, so they drop out of the menu. */
export function Header({ hiddenHrefs = [], showSignup = true }: { hiddenHrefs?: string[]; showSignup?: boolean }) {
  const items = nav.filter((item) => !hiddenHrefs.includes(item.href));
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || open
          ? "border-b border-gold-500/15 bg-night-950/95 py-3 backdrop-blur-xl"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container-page flex items-center justify-between gap-6">
        <Link href="/" aria-label="Bin Aziz Tourism — Home" className="shrink-0">
          <Image src={logo} alt="Bin Aziz Tourism and Consultants" priority className="h-10 w-auto md:h-12" />
        </Link>

        <Suspense fallback={<DesktopNav items={items} pathname={null} />}>
          <ActiveDesktopNav items={items} />
        </Suspense>

        <div className="flex items-center gap-3">
          {showSignup && (
            <Suspense fallback={<span className="h-10 w-24" aria-hidden />}>
              <AuthButton />
            </Suspense>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-11 place-items-center rounded-full border border-gold-500/30 text-ivory-100 lg:hidden"
          >
            <Icon name={open ? "close" : "menu"} className="size-5" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="container-page mt-3 flex flex-col pb-4 lg:hidden" aria-label="Mobile">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-ivory-100/10 py-4 font-display text-2xl text-ivory-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
