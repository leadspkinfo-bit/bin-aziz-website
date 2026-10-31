import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type PackageTeaser = {
  id: string;
  slug: string;
  title: string;
  category: string;
  tier: string;
  duration_days: number | null;
  teaser: string;
  cover_url: string | null;
};

export type PackageDetails = {
  price_text: string | null;
  makkah_hotel: string | null;
  madinah_hotel: string | null;
  inclusions: string[];
  itinerary: string | null;
  notes: string | null;
};

const TEASER_COLUMNS = "id, slug, title, category, tier, duration_days, teaser, cover_url";
const DETAIL_COLUMNS = "package_id, price_text, makkah_hotel, madinah_hotel, inclusions, itinerary, notes";

// Reads the session cookie, so callers must render inside <Suspense>.
// Row level security returns details only for signed-in users; for visitors
// the details query simply comes back empty.
export async function getPackages() {
  await connection(); // auth reads the clock (token expiry) — request time only
  const supabase = await createClient();
  const [{ data: auth }, { data: packages, error }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("packages").select(TEASER_COLUMNS).order("sort_order").order("created_at"),
  ]);
  // Database errors carry a code; fetches aborted by Next's background prerender don't and are harmless.
  if (error?.code) console.error("packages query failed:", error.message);

  const signedIn = Boolean(auth.user);
  const prices = new Map<string, string | null>();
  if (signedIn && packages?.length) {
    const { data } = await supabase
      .from("package_details")
      .select("package_id, price_text")
      .in("package_id", packages.map((p) => p.id));
    data?.forEach((d) => prices.set(d.package_id, d.price_text));
  }
  return { signedIn, packages: (packages ?? []) as PackageTeaser[], prices };
}

export async function getPackage(slug: string) {
  await connection();
  const supabase = await createClient();
  const [{ data: auth }, { data: pkg }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("packages").select(TEASER_COLUMNS).eq("slug", slug).maybeSingle(),
  ]);
  const signedIn = Boolean(auth.user);
  let details: PackageDetails | null = null;
  if (signedIn && pkg) {
    const { data } = await supabase.from("package_details").select(DETAIL_COLUMNS).eq("package_id", pkg.id).maybeSingle();
    details = data;
  }
  return { signedIn, pkg: pkg as PackageTeaser | null, details };
}
