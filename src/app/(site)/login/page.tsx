import type { Metadata } from "next";
import { Suspense } from "react";
import { Icon } from "@/components/icons";
import { LoginCard } from "./LoginCard";
import { requirePage } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Sign up with Google or email to unlock full package details, prices and hotels.",
};

const perks = ["Full package prices", "Hotel names in Makkah & Madinah", "Complete inclusions and itinerary"];

export default async function LoginPage() {
  await requirePage("page_signup");
  return (
    <section className="relative overflow-hidden bg-night-950 pt-40 pb-28 text-ivory-50 md:pt-48">
      <div className="bg-islamic-pattern absolute inset-0" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgb(36_50_99/0.9),transparent_60%)]" />
      <div className="container-page relative grid items-center gap-14 lg:grid-cols-2">
        <div>
          <p className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">
            <span className="h-px w-8 bg-current" /> Free account
          </p>
          <h1 className="mt-5 font-display text-5xl leading-[1.02] font-medium md:text-7xl">
            Unlock our <span className="text-gold-gradient italic">premium packages.</span>
          </h1>
          <ul className="mt-8 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-ivory-100/75">
                <span className="grid size-6 place-items-center rounded-full bg-gold-500/15 text-gold-400">
                  <Icon name="check" className="size-3.5" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <Suspense fallback={<div className="h-80 rounded-[2rem] bg-ivory-50" />}>
          <LoginCard />
        </Suspense>
      </div>
    </section>
  );
}
