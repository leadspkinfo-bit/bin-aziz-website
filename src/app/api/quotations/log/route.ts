import { z } from "zod";
import { hasCalculatorAccess } from "@/lib/calcAccess";
import { logDetails } from "@/lib/calc/logDetails";
import { priceQuotation } from "@/lib/calc/quotations";
import { quotationSchema } from "@/lib/calc/schema";
import { tripStays } from "@/lib/calc/trip";
import { serviceClient } from "@/lib/supabase/service";

const body = quotationSchema.extend({ spoId: z.string().uuid(), action: z.enum(["whatsapp", "pdf"]) });

const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString("en-US")}`;

/**
 * Records one sent quotation against the SPO who prepared it (WhatsApp opened or PDF downloaded).
 * Calculator access is required; totals are priced again here, never taken from the browser; the row is
 * written with the service role, so the log can't be filled or changed from a browser.
 */
export async function POST(request: Request) {
  if (!(await hasCalculatorAccess())) return Response.json({ status: "error", message: "Calculator access required." }, { status: 401 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ status: "error", message: "Invalid request." }, { status: 400 });
  const q = parsed.data;

  const db = serviceClient();
  if (!db) return Response.json({ status: "error", message: "Activity log is not set up (SUPABASE_SERVICE_ROLE_KEY missing)." }, { status: 503 });

  const { data: spo } = await db.from("spos").select("id, name").eq("id", q.spoId).eq("active", true).maybeSingle();
  if (!spo) return Response.json({ status: "error", message: "Choose your name in “Prepared By” again." }, { status: 400 });

  const result = await priceQuotation(q.packages, q.season);
  // one line per package: travellers, hotels in trip order, total
  const summary = result.packages
    .map((p) => {
      const people = [`${p.adults}A`, p.children ? `${p.children}C` : "", p.infants ? `${p.infants}I` : ""].filter(Boolean).join(" ");
      const hotels = tripStays(p)
        .map((h) => `${h.city} ${h.name} ${h.nights}N ${h.room}`)
        .join(" → ");
      return `P${p.packageNumber}: ${people} · ${hotels || "no hotel"} · ${p.transportType === "private" ? "Private" : "Bus"} · ${pkr(p.finalPackageTotal)}`;
    })
    .join("\n");

  const { error } = await db.from("quotation_log").insert({
    spo_id: spo.id,
    spo_name: spo.name,
    action: q.action,
    client_name: q.familyHead.slice(0, 200) || null,
    client_phone: q.contactNo.slice(0, 50) || null,
    branch: q.branch.slice(0, 100) || null,
    package_count: result.packages.length,
    summary,
    grand_total: result.grandTotal,
    // every package priced and readable (hotels in trip order, prices, the hidden markup) for the admin
    packages_json: logDetails(result, q.packages),
  });
  if (error) {
    console.error("quotation log failed:", error);
    return Response.json({ status: "error", message: "Could not record this quotation." }, { status: 500 });
  }
  return Response.json({ status: "success" });
}
