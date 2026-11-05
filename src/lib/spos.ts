import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";

export const SPOS_TAG = "spos";
export type Spo = { id: string; name: string };

/** The active SPOs for the calculator's "Prepared By" list, A–Z. Cached; an admin change refreshes it. */
export async function getSpos(): Promise<Spo[]> {
  "use cache";
  cacheTag(SPOS_TAG);
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const { data, error } = await supabase.from("spos").select("id, name").eq("active", true).order("name");
  // no list (016_spo_activity.sql not run yet, or a failed read): kept only briefly, so the names show up
  // as soon as they exist instead of an empty list being remembered for an hour
  if (error || !data?.length) {
    cacheLife("seconds");
    return [];
  }
  cacheLife("hours");
  return data as Spo[];
}
