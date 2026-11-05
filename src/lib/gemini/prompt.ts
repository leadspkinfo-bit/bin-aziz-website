export type ScanTarget = "makkah" | "madina" | "transport" | "auto";

const HINTS: Record<ScanTarget, string> = {
  makkah: 'Is image ke saare hotels ka city "Makkah" set karo.',
  madina: 'Is image ke saare hotels ka city "Madina" set karo.',
  transport: "Ye visa/transport rate list hai. hotels array khali chhodo, sirf visaBus/visaPrivate/ziyarat bharo.",
  auto: "City column ya heading dekh kar khud decide karo ke hotel Makkah ka hai ya Madina ka.",
};

// Copy-sensitive: the exact wording of the original scanner, plus rule 10 and "seasons" for the four calculator seasons,
// and rules 11–12 for lists like the 1448H sheet (quint room prices inside the sharing column, a DBL-TPL-QD room column).
export function scanPrompt(target: ScanTarget) {
  return [
    "You are a strict OCR + table extraction engine for Umrah hotel rate lists.",
    HINTS[target],
    "",
    "ABSOLUTE RULES:",
    "1. NEVER calculate. Never divide, multiply, add or round anything. Copy every number exactly as printed in the image.",
    "2. The five per-person fields mean beds per room: sharing = 6 beds, quint = 5, quad = 4, triple = 3, double = 2.",
    "3. If the image prints those per-person columns, copy each printed number into the matching field and set roomRate to null.",
    "4. If the image prints only ONE price per hotel per period (the whole-room price), put it in roomRate and leave all five fields null.",
    '5. Blank, "-", "N/A", "on request" => null. Never invent 0, and never copy a neighbouring column to fill a gap.',
    "6. Copy period / season column headings word for word, exactly as written, including dates.",
    "7. Read EVERY row. Do not skip, do not summarise, do not merge two hotels into one.",
    '8. Hotel name exactly as printed. Distance/landmark text goes in "location".',
    "9. Output JSON only. No markdown fences, no commentary.",
    '10. For every rate row also fill "seasons": the Umrah seasons its period falls in, chosen only from "Before Ramadan", "1st Ashra Ramadan", "Mid Ashra Ramadan", "Last Ashra Ramadan", "Shawwal" (Ramadan days 1-10, 11-20, 21-30; Shawwal = the month after Ramadan, Eid ul Fitr onwards). List all that the period covers; any other period is "Before Ramadan".',
    '11. A cell that carries its own room-type word (e.g. "QUINT 420" printed inside the sharing column) belongs to that room type: put 420 in "quint", and leave the column it sits in null for that hotel.',
    '12. A combined room column such as "DBL-TPL-QD ROOM RATE" is the whole-room price: put it in roomRate, even when the same row also prints a sharing price.',
    '13. Headings are often in Urdu above the dates: "پہلا عشرہ" = 1st Ashra, "دوسرا عشرہ" = 2nd (Mid) Ashra, "آخری عشرہ" = Last Ashra, "پہلا اور دوسرا عشرہ" = 1st & 2nd Ashra, "پہلا دوسرا اور آخری عشرہ" = all three, "شوال" / "عید الفطر" = Shawwal. Put the Urdu words AND their English meaning AND the dates in "period", e.g. "پہلا اور دوسرا عشرہ (1st & 2nd Ashra Ramadan) 06 FEB TILL 27 FEB", and list every Ashra the heading names in "seasons". The Urdu words decide the Ashra, not the dates.',
    '14. When the heading over a pair of columns covers several Ashras, every hotel row under it gets ONE rate with that period; do not split or copy it into separate periods yourself.',
    '15. "visaPrivate" only from a printed PRIVATE TRANSPORT price table (e.g. "JEDDAH TO MAKKAH PRIVATE TRANSPORT 4 PAX 620, 3 PAX 640 ..."). A single "VISA RATE 550 ROUND TRIP BY BUS" / "01 TO 47 PAX GROUP" is a bus rate: put it only in visaBus and leave visaPrivate empty. "ONLY VISA", "PARTIAL VISA" and "INFANT VISA" are not bus or private rates: leave them out.',
    "",
    "Shape:",
    '{"periods":["..."],',
    ' "hotels":[{"city":"Makkah","name":"...","location":"...",',
    '   "rates":[{"period":"...","seasons":["Before Ramadan"],"roomRate":1200,"sharing":null,"quint":null,"quad":null,"triple":null,"double":null}]}],',
    ' "visaBus":[{"pax":5,"rate":615}],',
    ' "visaPrivate":[{"pax":5,"rate":900}],',
    ' "ziyarat":{"makkah":10,"madina":10}}',
  ].join("\n");
}
