import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { requirePage } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Become a Member",
  description: "Bin Aziz membership is coming soon.",
};

export default async function MembershipPage() {
  await requirePage("page_membership");
  return (
    <section className="relative grid min-h-dvh place-items-center overflow-hidden bg-night-950 px-5 pt-32 pb-20 text-center text-ivory-50">
      <div className="bg-islamic-pattern absolute inset-0" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgb(36_50_99/0.9),transparent_60%)]" />
      <div className="relative max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.35em] text-gold-400 uppercase">Become a member</p>
        <h1 className="mt-6 font-display text-6xl font-medium md:text-8xl">
          <span className="text-gold-gradient italic">Coming soon</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-ivory-100/65">
          We are preparing something special for our members, in sha Allah. Stay tuned.
        </p>
        <div className="mt-10">
          <Button href="/packages" variant="outline">
            Explore packages
          </Button>
        </div>
      </div>
    </section>
  );
}
