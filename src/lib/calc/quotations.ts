import { renderToBuffer } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { connection } from "next/server";
import type { DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { QuotationPDF, type QuotationMeta } from "@/components/pdf/QuotationPDF";
import type { MultiPackageResult } from "./engine";
import { computeMultiPackage, missingRates } from "./engine";
import { getRates } from "./rates";
import type { QuotationBody } from "./schema";

/** "Package 2: X has no QUINT rate in …" for every hotel row whose room is N/A; empty when all are priced. */
export async function rateProblems(packages: QuotationBody["packages"], season: string) {
  const rates = await getRates();
  return packages.flatMap((p, i) => missingRates({ ...p, season }, rates).map((m) => `Package ${i + 1}: ${m}.`));
}

// internal costs, and every ziyarat figure (the client only ever reads "Free Ziyarat Included")
const HIDDEN = [
  "grandTotal",
  "vRatePKR",
  "dynamicProfitPKR",
  "hotelCostSAR",
  "visaCostSAR",
  "ziyaratSAR",
  "ziyaratTotalSAR",
  "ziyaratPKR",
  "ziyaratTotalPKR",
  "ziyaratAdults",
  "ziyaratChildren",
  "ziyaratMakkah",
  "ziyaratMadina",
  "sarToPkr",
] as const;

/**
 * The calculation as the browser receives it: totals and the lines a quotation prints, without the
 * internal parts (hotel / visa / ziyarat cost in SAR, exchange rate, profit, land cost per person).
 */
export function publicResult(result: MultiPackageResult) {
  return {
    ...result,
    packages: result.packages.map((p) => {
      const out: Partial<typeof p> = { ...p };
      for (const key of HIDDEN) delete out[key];
      return out as Omit<typeof p, (typeof HIDDEN)[number]>;
    }),
  };
}
export type PublicResult = ReturnType<typeof publicResult>;

/** Totals are always worked out here from the database rates; client totals are never trusted. */
export async function priceQuotation(packages: QuotationBody["packages"], season: string) {
  return computeMultiPackage(packages.map((p) => ({ ...p, season })), await getRates());
}

export type QuotationRow = {
  id: string;
  family_head: string | null;
  contact_no: string | null;
  branch: string | null;
  prepared_by: string | null;
  season: string | null;
  notes: string | null;
  results_json: MultiPackageResult;
  grand_total: number;
  created_at: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A saved quotation, for a signed-in admin only (row-level security: "Admins manage quotations").
 * There is no public share link: quotations go to clients as WhatsApp text and a PDF the staff send.
 */
export async function getQuotation(id: string): Promise<QuotationRow | null> {
  // Supabase checks token expiry with Date.now(); a quotation is always read per request, never prerendered.
  await connection();
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("quotations").select("*").eq("id", id).maybeSingle();
  return data as QuotationRow | null;
}

export function quotationMeta(q: QuotationRow): QuotationMeta {
  return {
    familyHead: q.family_head ?? "",
    contactNo: q.contact_no ?? "",
    branch: q.branch ?? "",
    preparedBy: q.prepared_by ?? "",
    season: q.season ?? "",
    notes: q.notes ?? "",
  };
}

/** The quotation PDF as bytes, with the file name the client sees. */
async function renderQuotationPdf(meta: QuotationMeta, result: MultiPackageResult) {
  const buffer = await renderToBuffer(createElement(QuotationPDF, { meta, result }) as unknown as ReactElement<DocumentProps>);
  const name = `${(meta.familyHead || "Client").replace(/[^\w .-]/g, "").trim() || "Client"}_Umrah_Quotation.pdf`;
  return { buffer, name };
}

/** `inline` shows the PDF in the browser (links sent on WhatsApp); otherwise it downloads. */
export async function pdfResponse(meta: QuotationMeta, result: MultiPackageResult, disposition: "attachment" | "inline" = "attachment") {
  const { buffer, name } = await renderQuotationPdf(meta, result);
  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `${disposition}; filename="${name}"`, "Cache-Control": "no-store" },
  });
}
