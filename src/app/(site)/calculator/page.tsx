import type { Metadata } from "next";
import { Suspense } from "react";
import { Calculator } from "@/components/calculator/Calculator";
import { CodeGate } from "@/components/calculator/CodeGate";
import { hasCalculatorAccess, hasCalculatorAdmin } from "@/lib/calcAccess";
import { getSpos } from "@/lib/spos";
import { CALC_SECTIONS, getSettings, requirePage, type CalcSections } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Umrah Calculator",
  description: "Build a multi-package Umrah quotation with live hotel, visa and transport rates.",
};

async function Gated() {
  if (!(await hasCalculatorAccess())) return <CodeGate />;
  const settings = await getSettings();
  const sections = Object.fromEntries(CALC_SECTIONS.map((k) => [k, settings[k]])) as CalcSections;
  return <Calculator sections={sections} adminUnlocked={await hasCalculatorAdmin()} spos={await getSpos()} />;
}

export default async function CalculatorPage() {
  await requirePage("page_calculator");
  return (
    // the navy band sits behind the site header, whose light text needs a dark background
    <div className="bg-[linear-gradient(to_bottom,var(--color-night-950)_0,var(--color-night-950)_16rem,#f0f2f5_16rem)] px-4 pt-32 pb-20">
      <Suspense fallback={<p className="text-center text-sm text-ivory-100/60">Loading…</p>}>
        <Gated />
      </Suspense>
    </div>
  );
}
