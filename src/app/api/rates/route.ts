import { hasCalculatorAccess } from "@/lib/calcAccess";
import { getRates, rateCatalog } from "@/lib/calc/rates";

export async function GET() {
  if (!(await hasCalculatorAccess())) return Response.json({ message: "Access code required." }, { status: 401 });
  // availability only: the numbers stay on the server
  return Response.json(rateCatalog(await getRates()), { headers: { "Cache-Control": "private, max-age=60" } });
}
