import { revalidateTag } from "next/cache";
import { adminClient } from "@/lib/admin";
import { applyScan } from "@/lib/calc/applyScan";
import { RATES_TAG } from "@/lib/calc/constants";
import { answersToAliases, loadAliases, rememberAliases, storedHotelNames } from "@/lib/calc/hotelMemory";
import { canonicalize, type NameAnswer } from "@/lib/calc/hotelNames";
import { combineScans, isEmptyScan, type NormalizedScan } from "@/lib/gemini/normalize";

export const maxDuration = 60;

type Body = { scans?: NormalizedScan[]; mode?: string; answers?: NameAnswer[]; dryRun?: boolean };

const validAnswers = (v: unknown): NameAnswer[] =>
  Array.isArray(v)
    ? v.filter(
        (a): a is NameAnswer =>
          a && (a.city === "makkah" || a.city === "madina") && typeof a.name === "string" && a.name.length <= 200 && (a.target === null || (typeof a.target === "string" && a.target.length <= 200)),
      )
    : [];

/**
 * Saves a scanned batch. Hotel names are first put under the names they are stored as (spellings,
 * "A/B" rows, earlier answers); a name the server is not sure about comes back as a question and nothing
 * is saved until the admin answers. `dryRun` only returns that plan.
 */
export async function POST(request: Request) {
  const admin = await adminClient();
  if (!admin) return Response.json({ status: "error", message: "Admin login required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!Array.isArray(body?.scans) || (body.mode !== "replace" && body.mode !== "merge")) {
    return Response.json({ status: "error", message: "Invalid request." }, { status: 400 });
  }

  const scan = combineScans(body.scans);
  if (isEmptyScan(scan)) {
    return Response.json({
      status: "error",
      message: "Picture se koi rate nahi nikla, is liye sheets ko haath nahi lagaya. Picture saaf aur seedhi honi chahiye, aur table poora nazar aana chahiye.",
    });
  }

  try {
    const answers = validAnswers(body.answers);
    const [stored, { aliases, ready }] = await Promise.all([storedHotelNames(admin.supabase), loadAliases(admin.supabase)]);
    const named = canonicalize({ makkah: scan.makkah, madina: scan.madina }, stored, aliases, answers);
    if (body.dryRun || named.questions.length) {
      return Response.json({ status: "plan", renames: named.renames, questions: named.questions, memory: ready });
    }
    const remembered = await rememberAliases(admin.supabase, answersToAliases(answers));
    const counts = await applyScan(admin.supabase, { ...scan, ...named.hotels }, body.mode);
    revalidateTag(RATES_TAG, { expire: 0 });
    return Response.json({
      status: "success",
      mode: body.mode,
      periods: scan.periods,
      ...counts,
      renames: named.renames,
      warnings: remembered ? [] : ["Your name answers were used but not remembered: run supabase/migrations/015_hotel_names.sql in Supabase."],
    });
  } catch (e) {
    console.error("apply scan failed:", e);
    return Response.json({ status: "error", message: "Rates save nahi ho sake. Kuch bhi tabdeel nahi hua." });
  }
}
