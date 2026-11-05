import { adminClient } from "@/lib/admin";
import { priceQuotation, rateProblems } from "@/lib/calc/quotations";
import { hasNoHotels, quotationSchema } from "@/lib/calc/schema";

const PAGE = 50;

export async function POST(request: Request) {
  const admin = await adminClient();
  if (!admin) return Response.json({ message: "Admin login required." }, { status: 401 });
  const parsed = quotationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.packages.some(hasNoHotels)) return Response.json({ message: "Invalid quotation." }, { status: 400 });

  const q = parsed.data;
  const problems = await rateProblems(q.packages, q.season);
  if (problems.length) return Response.json({ message: problems.join("\n") }, { status: 400 });
  const results = await priceQuotation(q.packages, q.season);
  const { data, error } = await admin.supabase
    .from("quotations")
    .insert({
      family_head: q.familyHead,
      contact_no: q.contactNo,
      branch: q.branch,
      prepared_by: q.preparedBy,
      season: q.season,
      notes: q.notes,
      packages_json: q.packages,
      results_json: results,
      grand_total: results.grandTotal,
    })
    .select("id")
    .single();
  if (error) {
    console.error("quotation save failed:", error.message);
    return Response.json({ message: "Could not save the quotation." }, { status: 500 });
  }
  return Response.json({ id: data.id });
}

export async function GET(request: Request) {
  const admin = await adminClient();
  if (!admin) return Response.json({ message: "Admin login required." }, { status: 401 });
  const page = Math.max(0, Number(new URL(request.url).searchParams.get("page")) || 0);
  const { data, error } = await admin.supabase
    .from("quotations")
    .select("id, family_head, contact_no, branch, prepared_by, season, grand_total, created_at")
    .order("created_at", { ascending: false })
    .range(page * PAGE, page * PAGE + PAGE - 1);
  if (error) return Response.json({ message: "Could not load quotations." }, { status: 500 });
  return Response.json({ quotations: data });
}
