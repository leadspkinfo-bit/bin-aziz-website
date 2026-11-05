import { hasCalculatorAccess } from "@/lib/calcAccess";
import { priceQuotation, publicResult, rateProblems } from "@/lib/calc/quotations";
import { calculateSchema, hasNoHotels } from "@/lib/calc/schema";

export async function POST(request: Request) {
  if (!(await hasCalculatorAccess())) return Response.json({ message: "Access code required." }, { status: 401 });
  const parsed = calculateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Invalid packages." }, { status: 400 });
  const empty = parsed.data.packages.findIndex(hasNoHotels);
  if (empty >= 0) return Response.json({ message: `Package ${empty + 1}: please add at least one hotel.` }, { status: 400 });
  const problems = await rateProblems(parsed.data.packages, parsed.data.season);
  if (problems.length) return Response.json({ message: problems.join("\n") }, { status: 400 });
  return Response.json(publicResult(await priceQuotation(parsed.data.packages, parsed.data.season)));
}
