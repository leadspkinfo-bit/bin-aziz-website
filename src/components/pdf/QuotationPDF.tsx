import { readFileSync } from "node:fs";
import path from "node:path";
import { Document, Image as PdfImage, Line, Page, Polygon, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { BRAND } from "@/lib/calc/constants";
import type { MultiPackageResult, PackageResult } from "@/lib/calc/engine";

export type QuotationMeta = { familyHead: string; contactNo: string; branch: string; preparedBy: string; season: string; notes: string };

// Handed over as bytes: react-pdf reads a Windows path like "C:\..." as a URL with a "c:" scheme.
const assets = new Map<string, { data: Buffer; format: "png" | "jpg" }>();
function asset(file: string) {
  if (!assets.has(file)) assets.set(file, { data: readFileSync(path.join(process.cwd(), "public", "pdf", file)), format: file.endsWith(".png") ? "png" : "jpg" });
  return assets.get(file)!;
}
const mm = (n: number) => n * 2.8346;
const pkr = (n: number) => Math.round(n).toLocaleString("en-US");

const { maroon, navy, gold } = BRAND;
const PAGE_H = 297;

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 8.5, color: "#222", paddingBottom: mm(16) },
  body: { paddingHorizontal: mm(10) },
  bar: { backgroundColor: maroon, color: "#fff", fontFamily: "Helvetica-Bold", textAlign: "center", padding: 3 },
  row: { flexDirection: "row" },
  cell: { flex: 1, border: "0.5pt solid #c9c9c9", padding: 2.5 },
  head: { backgroundColor: navy, color: "#fff", fontFamily: "Helvetica-Bold" },
  label: { fontFamily: "Helvetica-Bold", backgroundColor: "#eef1f4" },
  packageTotal: { backgroundColor: gold, color: navy, fontFamily: "Helvetica-Bold", fontSize: 11, textAlign: "center", padding: 3, marginTop: 3 },
  termHead: { fontFamily: "Helvetica-Bold", color: navy, fontSize: 10, marginTop: 7, marginBottom: 2 },
  term: { fontSize: 9, lineHeight: 1.35, marginBottom: 2, paddingLeft: 8 },
  bold: { fontFamily: "Helvetica-Bold" },
});

/** The same footer lines as the original, in mm from the top-left of an A4 page. */
function Footer() {
  const h = PAGE_H;
  return (
    <Svg fixed viewBox="0 0 210 297" style={{ position: "absolute", top: 0, left: 0, width: mm(210), height: mm(297) }}>
      <Polygon points={`140,${h - 5} 150,${h - 5} 150,${h - 10}`} fill={gold} />
      <Rect x={150} y={h - 10} width={60} height={5} fill={navy} />
      <Line x1={0} y1={h - 6.5} x2={138} y2={h - 6.5} stroke={navy} strokeWidth={0.5} />
      <Line x1={138} y1={h - 6.5} x2={148} y2={h - 11.5} stroke={navy} strokeWidth={0.5} />
      <Line x1={148} y1={h - 11.5} x2={210} y2={h - 11.5} stroke={navy} strokeWidth={0.5} />
    </Svg>
  );
}

function Cells({ cells, widths, head, align }: { cells: (string | number)[]; widths?: number[]; head?: boolean; align?: "center" }) {
  return (
    <View style={s.row} wrap={false}>
      {cells.map((c, i) => (
        <Text key={i} style={[s.cell, head ? s.head : {}, widths ? { flex: widths[i] } : {}, align ? { textAlign: align } : {}]}>
          {c}
        </Text>
      ))}
    </View>
  );
}

/** Room type, then the stay's rate period and its dates, one per line. */
const roomCell = (h: PackageResult["makkahDetails"][number]) => [h.room, h.season, h.dates].filter(Boolean).join("\n");

function PackageBlock({ p }: { p: PackageResult }) {
  const widths = [1, 3, 2, 1.3, 0.8];
  return (
    <View style={{ marginTop: 6 }} wrap={false}>
      <Text style={[s.bar, { fontSize: 10, padding: 2 }]}>
        PACKAGE {p.packageNumber} — {p.adults} Adults, {p.children} Children, {p.infants} Infants
      </Text>
      <Cells cells={[`Airline: ${p.airline} (${p.ticketType1} | ${p.ticketType2})`, `Ticket Price: PKR ${pkr(p.ticketPrice)}`]} />
      <Cells cells={[`Transport: ${p.transportType === "private" ? "Private Transport" : "Bus Sharing"}`, "Included"]} />
      <View style={{ marginTop: 3 }}>
        <Cells head cells={["City", "Hotel Name", "Location", "Room Type", "Nights"]} widths={widths} />
        {p.makkahDetails.map((h, i) => (
          <Cells key={`k${i}`} cells={["Makkah", h.name, h.location, roomCell(h), h.nights]} widths={widths} />
        ))}
        {p.madinaDetails.map((h, i) => (
          <Cells key={`d${i}`} cells={["Madina", h.name, h.location, roomCell(h), h.nights]} widths={widths} />
        ))}
        <View style={s.row} wrap={false}>
          <Text style={[s.cell, s.label, { flex: 7.3, textAlign: "right" }]}>Total Nights</Text>
          <Text style={[s.cell, s.label, { flex: 0.8 }]}>{p.totalMakkahNights + p.totalMadinaNights}</Text>
        </View>
      </View>
      <View style={{ marginTop: 3 }}>
        <Cells head cells={["Category", "No. of Pax", "Price Per Person", "Sub-Total"]} />
        <Cells cells={["Adults", p.adults, pkr(p.perAdultPrice), pkr(p.perAdultPrice * p.adults)]} />
        <Cells cells={["Children", p.children, "-", pkr(p.totalChildrenCost)]} />
        <Cells cells={["Infants", p.infants, p.infants > 0 ? pkr(p.infantPrice) : "-", pkr(p.totalInfantsCost)]} />
      </View>
      <Text style={[s.cell, s.bold, { marginTop: 3, textAlign: "center", fontSize: 9 }]}>Free Ziyarat Included</Text>
      {p.notes ? (
        <Text style={{ marginTop: 3, padding: 3, border: "0.5pt solid #c9c9c9", fontSize: 8.5 }}>
          <Text style={s.bold}>Notes: </Text>
          {p.notes}
        </Text>
      ) : null}
      <Text style={s.packageTotal}>
        PACKAGE {p.packageNumber} TOTAL: PKR {pkr(p.finalPackageTotal)}/-
      </Text>
    </View>
  );
}

function Term({ head, text }: { head: string; text: string }) {
  return (
    <Text style={s.term}>
      • <Text style={s.bold}>{head}:</Text> {text}
    </Text>
  );
}

const BANKS = [
  ["Habib Bank Ltd", "Bin Aziz Consultants", "53737000260655", "PK24HABB0053737000260655"],
  ["Bank Alfalah", "Bin Aziz Consultants", "56565001661483", "PK29ALFH56565005001661483"],
  ["Meezan Bank", "Bin Aziz Consultants", "02920112557994", "PK22MEZN0002920112557994"],
];

// Copy-sensitive: the agreement text is reproduced word for word.
function TermsPage() {
  return (
    <Page size="A4" style={s.page}>
      <View style={{ height: mm(20), backgroundColor: navy, justifyContent: "center" }}>
        <Text style={{ color: "#fff", fontSize: 14, textAlign: "center", fontFamily: "Helvetica-Bold" }}>UMRAH AGREEMENT</Text>
      </View>
      <View style={s.body}>
        <Text style={s.termHead}>1. Visa Processing & Embassy Protocols</Text>
        <Term head="Processing Period" text="Visa processing requires a specific number of working days as mutually agreed upon at the time of documentation submission." />
        <Term head="Embassy Authority" text="The company functions solely as a facilitator. We shall not be held liable for any processing delays, withheld passports, or visa rejections issued by the Saudi Embassy or relevant authorities." />
        <Text style={s.termHead}>2. Accommodation & Travel Regulations</Text>
        <Term head="Duration of Stay" text="The traveler (Zair) is authorized for a maximum stay of 28 days, strictly adhering to the specific limits of the selected and booked package." />
        <Term head="Flight Operations" text="The company assumes no liability for schedule changes, delays, or rescheduling of sector timings initiated by the airline." />
        <Text style={s.termHead}>3. Cancellations, Modifications & Ticketing</Text>
        <Term head="Ticketing Policy" text="Once a flight ticket is issued, all changes, transfers, or cancellations are governed exclusively by the airline's specific refund and change policies." />
        <Term head="Group Tickets" text="Please note that all Group Tickets are strictly Non-Refundable and Non-Changeable under any circumstances." />
        <Term head="Package Finalization" text="Umrah packages are customized based on initial client specifications. Once a package is finalized and booked, no further modifications or amendments can be accommodated." />
        <Text style={s.termHead}>4. Documentation, Biometrics & Fees</Text>
        <Term head="Biometric Requirements" text={'In instances of "Send to Embassy" processing, applicable Embassy fees will be charged to the client.'} />
        <Term head="Standard Charges" text="Should a passport require physical submission to the embassy, a mandatory fee of 8,000 PKR will be applied for standard processing." />
        <Term head="Urgent Submissions" text="For urgent processing, fees may increase up to 15,000 PKR." />
        <Text style={{ fontFamily: "Helvetica-BoldOblique", fontSize: 9, marginTop: 8 }}>
          Policy Note: All fees are subject to change without prior notice in accordance with the prevailing Saudi Embassy rules and regulations.
        </Text>
        <Text style={{ fontFamily: "Helvetica-Oblique", fontSize: 9, marginTop: 6, lineHeight: 1.35 }}>
          <Text style={s.bold}>Declaration: </Text>
          By signing this agreement, the client acknowledges having read, understood, and accepted the terms regarding visa processing, airline liabilities, the non-refundable nature of group tickets, and the non-modifiable status of finalized packages.
        </Text>
        <Text style={{ backgroundColor: navy, color: "#fff", fontFamily: "Helvetica-Bold", textAlign: "center", padding: 8, marginTop: 12 }}>OFFICIAL BANK ACCOUNT DETAILS</Text>
        <View style={{ fontSize: 8 }}>
          <View style={s.row}>
            {["Bank", "Account Title", "Account No", "IBAN"].map((h) => (
              <Text key={h} style={[s.cell, { backgroundColor: maroon, color: "#fff", fontFamily: "Helvetica-Bold", textAlign: "center" }]}>
                {h}
              </Text>
            ))}
          </View>
          {BANKS.map((b) => (
            <Cells key={b[0]} cells={b} align="center" />
          ))}
        </View>
      </View>
      <Footer />
    </Page>
  );
}

const STRIP = [
  { x: 25, title: "HEAD OFFICE", city: "Lahore" },
  { x: 65, title: "BRANCH 1", city: "Lahore City" },
  { x: 105, title: "BRANCH 2", city: "Layyah" },
  { x: 145, title: "BRANCH 3", city: "Layyah City" },
  { x: 185, title: "BRANCH 4", city: "Khushab" },
];
const SOCIAL = ["whatsapp", "facebook-new", "instagram-new", "tiktok", "youtube-play"];

function At({ y, size, color, bold, children }: { y: number; size: number; color: string; bold?: boolean; children: string }) {
  return <Text style={{ position: "absolute", top: mm(y), left: 0, right: 0, textAlign: "center", fontSize: size, color, fontFamily: bold ? "Helvetica-Bold" : "Helvetica" }}>{children}</Text>;
}

function ContactPage() {
  const y = 240; // branch strip, 15 mm under the contact heading block
  const loc = y + 6;
  return (
    <Page size="A4" style={s.page}>
      <View style={{ position: "absolute", top: mm(220), left: mm(10), right: mm(10), borderTop: "0.5pt solid #bbb" }} />
      <At y={224} size={12} color={maroon} bold>
        NEED ASSISTANCE? CONTACT OUR EXPERTS
      </At>
      <At y={230} size={9.5} color="#666">
        Helpline: 042 37874760 | +92 311 2462949
      </At>
      <At y={235} size={9.5} color="#666">
        Office M1-M3, 1st Floor, Abbas Trade Center, Main PIA Road, Lahore
      </At>
      {STRIP.map((b) => (
        <View key={b.x} style={{ position: "absolute", top: mm(y + 1), left: mm(b.x - 20), width: mm(40), alignItems: "center" }}>
          <Text style={{ fontSize: 8, color: navy, fontFamily: "Helvetica-Bold" }}>{b.title}</Text>
          <View style={[s.row, { marginTop: mm(2), alignItems: "center" }]}>
            <PdfImage src={asset("marker.png")} style={{ width: mm(3.5), height: mm(3.5), marginRight: 2 }} />
            <Text style={{ fontSize: 8, color: "#666" }}>{b.city}</Text>
          </View>
        </View>
      ))}
      {SOCIAL.map((icon, i) => (
        <PdfImage key={icon} src={asset(`${icon}.png`)} style={{ position: "absolute", top: mm(loc + 15), left: mm(78 + i * 12), width: mm(6), height: mm(6) }} />
      ))}
      <Footer />
    </Page>
  );
}

export function QuotationPDF({ meta, result }: { meta: QuotationMeta; result: MultiPackageResult }) {
  const today = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", dateStyle: "medium" }).format(new Date());
  const title = `${meta.familyHead || "Client"}_Umrah_Quotation.pdf`;
  return (
    <Document title={title}>
      <Page size="A4" style={s.page}>
        <PdfImage src={asset("header.jpg")} style={{ width: "100%" }} />
        <View style={s.body}>
          <Text style={[s.bar, { fontSize: 12 }]}>MULTI-PACKAGE UMRAH QUOTATION</Text>
          <Cells cells={["Date", today, "Client Name", meta.familyHead]} />
          <Cells cells={["Package Season", meta.season, "Contact No", meta.contactNo]} />
          <Cells cells={["Total Packages", result.packageCount, "Prepared By", meta.preparedBy]} />
          {result.packages.map((p) => (
            <PackageBlock key={p.packageNumber} p={p} />
          ))}
          <Text style={[s.bar, { fontSize: 14, marginTop: 6 }]} wrap={false}>
            GRAND TOTAL (All Packages): PKR {pkr(result.grandTotal)}/-
          </Text>
        </View>
        <Footer />
      </Page>
      <TermsPage />
      <ContactPage />
    </Document>
  );
}
