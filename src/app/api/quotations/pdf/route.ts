import { hasCalculatorAccess } from "@/lib/calcAccess";
import { pdfResponse, priceQuotation, rateProblems } from "@/lib/calc/quotations";
import { hasNoHotels, quotationSchema } from "@/lib/calc/schema";

/** PDF of an unsaved quotation: the visitor's inputs are priced again here, nothing is stored. */
export async function POST(request: Request) {
  if (!(await hasCalculatorAccess())) return Response.json({ message: "Access code required." }, { status: 401 });
  const parsed = quotationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.packages.some(hasNoHotels)) return Response.json({ message: "Invalid quotation." }, { status: 400 });
  const { packages, season, familyHead, contactNo, branch, preparedBy, notes } = parsed.data;
  const problems = await rateProblems(packages, season);
  if (problems.length) return Response.json({ message: problems.join("\n") }, { status: 400 });
  return pdfResponse({ familyHead, contactNo, branch, preparedBy, notes, season }, await priceQuotation(packages, season));
}
