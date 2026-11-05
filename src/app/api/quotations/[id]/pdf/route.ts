import { adminClient } from "@/lib/admin";
import { getQuotation, pdfResponse, quotationMeta } from "@/lib/calc/quotations";

/** A saved quotation's PDF — admins only (from /admin/quotations). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminClient())) return Response.json({ message: "Admin login required." }, { status: 401 });
  const quotation = await getQuotation((await params).id);
  if (!quotation) return Response.json({ message: "Not found." }, { status: 404 });
  return pdfResponse(quotationMeta(quotation), quotation.results_json, "inline");
}
