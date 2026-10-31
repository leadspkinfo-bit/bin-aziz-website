import type { Metadata } from "next";
import { Suspense } from "react";
import { PackageCard } from "@/components/packages/PackageCard";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { getPackages } from "@/lib/packages";
import { whatsappLink } from "@/lib/site";
import { requirePage } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Premium Packages",
  description: "Premium and family Umrah packages from Lahore. Sign up free to see prices, hotels and itineraries.",
};

async function PackageGrid() {
  const { signedIn, packages, prices } = await getPackages();

  if (!packages.length) {
    return (
      <div className="rounded-[2rem] border border-gold-500/25 bg-white p-12 text-center">
        <h2 className="font-display text-4xl text-night-900">New packages coming soon</h2>
        <p className="mx-auto mt-3 max-w-md text-ink/65">Message us on WhatsApp and our team will share the latest packages with you.</p>
        <div className="mt-8">
          <Button href={whatsappLink("Assalam o Alaikum, please share your latest Umrah packages.")} external>
            Ask on WhatsApp
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {packages.map((p) => (
        <PackageCard key={p.id} pkg={p} signedIn={signedIn} price={prices.get(p.id)} />
      ))}
    </div>
  );
}

function GridFallback() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[30rem] animate-pulse rounded-[2rem] bg-ivory-200/60" />
      ))}
    </div>
  );
}

export default async function PackagesPage() {
  await requirePage("page_packages");
  return (
    <>
      <PageHero
        arabic="لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ"
        eyebrow="Premium packages"
        title={
          <>
            Umrah packages, <span className="text-gold-gradient italic">curated with care.</span>
          </>
        }
        text="Browse our packages below. Sign up free — with Google or email — to see prices, hotels and the full itinerary."
      />
      <section className="bg-ivory-50 py-24 md:py-28">
        <div className="container-page">
          <Suspense fallback={<GridFallback />}>
            <PackageGrid />
          </Suspense>
        </div>
      </section>
    </>
  );
}
