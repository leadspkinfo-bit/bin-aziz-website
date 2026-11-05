import { revalidateTag } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/admin";
import { RATES_TAG } from "@/lib/calc/constants";
import { findDuplicates, rememberAliases } from "@/lib/calc/hotelMemory";

/** Hotels stored twice under two spellings (or an "A/B" row next to A and B): admin only. */
export async function GET() {
  const admin = await adminClient();
  if (!admin) return Response.json({ status: "error", message: "Admin login required." }, { status: 401 });
  return Response.json({ status: "success", duplicates: await findDuplicates(admin.supabase) });
}

const body = z.object({ dropId: z.string().uuid(), keepIds: z.array(z.string().uuid()).min(1).max(4) });

/** Merges one: the dropped hotel's rates move onto the kept one(s), and its spelling is remembered. */
export async function POST(request: Request) {
  const admin = await adminClient();
  if (!admin) return Response.json({ status: "error", message: "Admin login required." }, { status: 401 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ status: "error", message: "Invalid request." }, { status: 400 });
  const { dropId, keepIds } = parsed.data;

  // only a pair the server itself found can be merged
  const match = (await findDuplicates(admin.supabase)).find((d) => d.drop.id === dropId && d.keep.map((k) => k.id).join() === keepIds.join());
  if (!match) return Response.json({ status: "error", message: "These hotels are no longer duplicates. Refresh the page." }, { status: 400 });

  const { error } = await admin.supabase.rpc("merge_hotels", { drop_id: dropId, keep_ids: keepIds });
  if (error) {
    console.error("merge hotels failed:", error);
    const missing = error.code === "PGRST202" || error.code === "42883";
    return Response.json({ status: "error", message: missing ? "Run supabase/migrations/015_hotel_names.sql in Supabase first." : "Merge failed. Nothing was changed." });
  }
  // a spelling of one hotel: the next scan maps it by itself
  if (match.kind === "spelling") await rememberAliases(admin.supabase, [{ city: match.city, alias: match.drop.name, target: match.keep[0].name }]);
  revalidateTag(RATES_TAG, { expire: 0 });
  return Response.json({ status: "success" });
}
