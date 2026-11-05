"use client";

import { useEffect, type ReactNode } from "react";
import type { PublicResult } from "@/lib/calc/quotations";

import { whatsappNumber } from "@/lib/phone";

export { whatsappNumber };

export type ClientInfo = { familyHead: string; contactNo: string; branch: string; preparedBy: string };

const money = (n: number) => `PKR ${Math.round(n).toLocaleString("en-US")}`;

const RULE = "--------------------";

import { splitLocation, tripStays } from "@/lib/calc/trip";

export { splitLocation, tripStays };

const travelDate = (iso?: string) =>
  iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`)) : "";

/**
 * The quotation as one WhatsApp message, in the layout the user set (2026-11-05): plain text, no emoji
 * (phones showed "?" boxes), one blank line between sections, hotels in trip order, no internal season or
 * rate-period names, prices per person only, grand total at the bottom. *bold* is WhatsApp's own formatting.
 */
export function whatsappMessage(client: ClientInfo, result: PublicResult) {
  const out: string[] = [
    "*BIN AZIZ GROUP*",
    "*UMRAH QUOTATION*",
    "",
    `Assalam o Alaikum${client.familyHead ? ` ${client.familyHead}` : ""},`,
    "Thank you for choosing Bin Aziz.",
  ];
  const many = result.packages.length > 1;

  result.packages.forEach((p, i) => {
    if (i > 0) out.push("", RULE);
    out.push("", `*PACKAGE ${p.packageNumber}*`);
    const stays = tripStays(p);
    const first = stays.find((h) => h.from)?.from;
    if (first) out.push("", "Travelling Date", `Date: ${travelDate(first)}`);
    if (p.airline && p.airline !== "-" && p.airline !== "NONE") out.push("", `Airline: ${p.airline} (${p.ticketType1})`);
    for (const h of stays) {
      const { street, distance } = splitLocation(h.location);
      out.push("", `*${h.city}*`, `• ${h.name}${distance ? ` (${distance})` : ""}`);
      if (street) out.push(street);
      out.push(`${h.nights} ${h.nights === 1 ? "night" : "nights"}`, h.room);
    }
    const nights = p.totalMakkahNights + p.totalMadinaNights;
    if (nights) out.push("", `Total nights: ${nights}`);
    out.push("", "*Price*");
    if (p.adults) out.push(`Adults per person : ${money(p.perAdultPrice)}`);
    // one line when every child costs the same, else one per bed type
    const kids = p.childPrices ?? [];
    if (kids.length && kids.every((c) => c.each === kids[0].each)) out.push(`Child per person : ${money(kids[0].each)}`);
    else for (const c of kids) out.push(`Child per person (${c.bedType.toLowerCase()}) : ${money(c.each)}`);
    if (p.infants) out.push(`Infant per person : ${money(p.infantPrice)}`);
    out.push("Free Ziyarat Included");
    if (p.notes) out.push(`Notes: ${p.notes}`);
    if (many) out.push(`*Package ${p.packageNumber} total: ${money(p.finalPackageTotal)}/-*`);
    out.push(
      "",
      "*Package Includes:*",
      "- Visa",
      "- Insurance",
      "- Hotel",
      p.transportType === "private" ? "- Private transport" : "- Transport by bus",
      "- Tickets",
      "- Ziyarat",
    );
  });

  out.push("", RULE, `*GRAND TOTAL: ${money(result.grandTotal)}/-*`, "", "*12 Hours Validity*");
  return out.join("\n");
}

/** Shows WhatsApp's *bold* the way the chat will. */
function waBold(text: string) {
  return text.split(/(\*[^*\n]+\*)/g).map((part, i) => (part.startsWith("*") && part.endsWith("*") && part.length > 2 ? <strong key={i}>{part.slice(1, -1)}</strong> : part));
}

function Modal({ label, onClose, children, wide }: { label: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${wide ? "max-w-4xl" : "max-w-md"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="font-bold text-[#044064]">{label}</h3>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** The quotation PDF shown in the page before downloading or sending it. */
export function PdfPreview({ url, onDownload, onClose }: { url: string; onDownload: () => void; onClose: () => void }) {
  return (
    <Modal label="Quotation preview" onClose={onClose} wide>
      <iframe title="Quotation PDF" src={url} className="h-[75dvh] w-full" />
      <div className="flex justify-end gap-2 border-t border-slate-200 p-3">
        <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700">
          Open in new tab
        </a>
        <button type="button" onClick={onDownload} className="rounded-lg bg-[#044064] px-4 py-2 text-sm font-bold text-white">
          Download
        </button>
      </div>
    </Modal>
  );
}

/** What the client will receive on WhatsApp, as a chat bubble. */
export function WhatsappPreview({ number, message, onSend, onClose }: { number: string | null; message: string; onSend: () => void; onClose: () => void }) {
  return (
    <Modal label="WhatsApp preview" onClose={onClose}>
      <div className="overflow-y-auto bg-[#e5ddd5] p-4">
        <p className="mb-3 text-center text-xs text-slate-600">To: {number ? `+${number}` : "no contact number entered"}</p>
        <div className="ml-auto max-w-[90%] space-y-2 rounded-lg rounded-tr-none bg-[#dcf8c6] p-2.5 text-sm text-slate-800 shadow">
          <p className="whitespace-pre-line">{waBold(message)}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-200 p-3">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700">
          Close
        </button>
        <button type="button" disabled={!number} onClick={onSend} className="rounded-lg bg-[#25d366] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          Send on WhatsApp
        </button>
      </div>
    </Modal>
  );
}
