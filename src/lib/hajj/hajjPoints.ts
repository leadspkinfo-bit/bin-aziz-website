import type { HaramItem, Vec3 } from "@/lib/haramHistoricalData";
import { hajjStep, type HajjStepId } from "./hajjData";

export type HajjStage = "mina" | "arafat" | "muzdalifah" | "jamarat" | "qurbani";

/**
 * 3D markers of the Hajj scenes. Choosing one flies the camera to `eye`, looking at `look`, and only
 * then opens the data of a step in hajjGuideData; `lines` replace the step's list when a marker
 * needs its own wording (still only facts already in that data).
 */
type Point = { id: string; label: string; stage: HajjStage; at: Vec3; eye: Vec3; look: Vec3; step: HajjStepId; lead?: string; lines?: (pebbles: number) => string[] };

export const hajjPoints: Point[] = [
  { id: "mina-tents", eye: [50, 9, 46], look: [34, 3, 24], label: "Tents of Mina · 8th", stage: "mina", at: [34, 9, 24], step: "day-8-mina" },
  { id: "mina-tashreeq", eye: [-22, 9, -8], look: [-38, 3, -30], label: "Back in Mina · 11th–13th", stage: "mina", at: [-38, 9, -30], step: "day-11-tashreeq" },
  { id: "arafat-mount", eye: [17, 46, 24], look: [0, 42, 0], label: "Jabal al-Rahmah", stage: "arafat", at: [0, 49, 0], step: "day-9-arafat", lead: "The Mount of Mercy stands within Arafat, but Wuquf is valid anywhere inside the boundaries — you don’t need to climb it." },
  { id: "arafat-plain", eye: [86, 6, 54], look: [64, 1.5, 36], label: "The Wuquf", stage: "arafat", at: [64, 5, 36], step: "day-9-arafat" },
  {
    id: "muz-pebbles", eye: [0.9, 0.9, 6.6], look: [0, 0, 4],
    label: "Pebbles",
    stage: "muzdalifah",
    at: [0, 0.9, 4],
    step: "day-9-muzdalifah",
    lead: "Small pebbles, each about the size of a chickpea.",
    lines: (n) => [
      `You need ${n}: 7 on the 10th, 21 on the 11th, 21 on the 12th${n === 70 ? ", and 21 on the 13th" : ""}.`,
      "Pick them up here if you wish; they may be taken from anywhere except the spot of the Jamarat itself.",
      "Don’t break them from rock, and carry a few spare in case one misses the basin.",
    ],
  },
  {
    id: "muz-prayers", eye: [-2, 2.2, 4], look: [-9, 1, -8],
    label: "Maghrib & Isha",
    stage: "muzdalifah",
    at: [-9, 2.2, -8],
    step: "day-9-muzdalifah",
    lead: "Under the open sky, the two prayers are joined.",
    lines: () => ["Pray Maghrib and Isha together in the time of Isha, with one adhan and one iqamah.", "Don’t pray Maghrib on the road; if the traffic delays you, pray before Fajr comes in."],
  },
  {
    id: "jam-sughra", eye: [-48, 30, 18], look: [-62, 33, 0],
    label: "Jamarat al-Sughra",
    stage: "jamarat",
    at: [-62, 41, 0],
    step: "day-11-tashreeq",
    lead: "The small Jamrah, also called al-Ula. It is stoned first.",
    lines: () => ["10th: not stoned.", "11th, 12th and 13th: stoned first, after noon, with seven pebbles.", "Then step aside, face the Qibla and make a long du‘a."],
  },
  {
    id: "jam-wusta", eye: [14, 30, 18], look: [0, 33, 0],
    label: "Jamarat al-Wusta",
    stage: "jamarat",
    at: [0, 41, 0],
    step: "day-11-tashreeq",
    lead: "The middle Jamrah. It is stoned second.",
    lines: () => ["10th: not stoned.", "11th, 12th and 13th: seven pebbles after the small Jamrah.", "Then step aside and make du‘a."],
  },
  {
    id: "jam-aqabah", eye: [76, 30, 18], look: [62, 33, 0],
    label: "Jamarat al-Aqabah",
    stage: "jamarat",
    at: [62, 41, 0],
    step: "day-10-rami",
    lead: "The large Jamrah, closest to Makkah.",
    lines: () => ["10th: the only Jamrah stoned today, with seven pebbles.", "11th, 12th and 13th: stoned last, with seven pebbles.", "Leave without stopping for du‘a at this one."],
  },
  {
    id: "qurbani-sunnah",
    eye: [14, 7, 62],
    look: [0, 1, 44],
    label: "The sunnah of Ibrahim (AS)",
    stage: "qurbani",
    at: [0, 4, 44],
    step: "day-10-qurbani",
    lead: "Why pilgrims sacrifice on this day.",
    lines: () => [
      "Ibrahim (AS) saw in a dream that he was sacrificing his son. He told him, and the son replied: “Do as you are commanded; you will find me, if Allah wills, among the patient.”",
      "When both had submitted, Allah called to him that he had fulfilled the vision, and ransomed the son with a great sacrifice.",
      "The sacrifice remembers that obedience. What reaches Allah is not the meat but the piety of the one who offers it.",
    ],
  },
  {
    id: "qurbani-voucher",
    eye: [-10, 6, 100],
    look: [-20, 3, 76],
    label: "The voucher system",
    stage: "qurbani",
    at: [-20, 9, 72],
    step: "day-10-qurbani",
    lead: "How the Adahi project sacrifices on your behalf.",
    lines: () => [
      "Your group arranges the Qurbani, or you buy an Adahi voucher through official channels such as Nusuk.",
      "The project acts on your behalf at every stage. The voucher covers veterinary and Sharia checks, slaughter, processing, freezing and distribution.",
      "Meat goes to those in need around the Haram, and the surplus to other countries.",
      "Because order matters in the Hanafi school, find out when your sacrifice is done before you shave. Ask your group’s scholar how your arrangement confirms it.",
    ],
  },
  {
    id: "qurbani-ruling",
    eye: [12, 8, 34],
    look: [0, 5, 16],
    label: "Why it is mandatory",
    stage: "qurbani",
    at: [0, 13, 18],
    step: "day-10-qurbani",
    lead: "The ruling for a Tamattu‘ pilgrim.",
    lines: () => [
      "It is wajib on every Tamattu‘ pilgrim: the Qur’an commands it for whoever joins Umrah to Hajj.",
      "It comes strictly between the stoning of Jamarat al-Aqabah and Halq or Taqsir.",
      "It must be done in the Haram, by sunset of the 12th in the Hanafi school.",
      "Someone who truly cannot afford it fasts ten days instead: three during Hajj and seven after returning home.",
    ],
  },
];

/** The marker's content, in the same shape as the Haram's cards. */
export function hajjPointCard(id: string, pebbles: number): HaramItem | undefined {
  const point = hajjPoints.find((p) => p.id === id);
  if (!point) return undefined;
  const step = hajjStep(point.step);
  return {
    id,
    name: point.label,
    arabic: step.arabic ?? "",
    category: "Hajj",
    tagline: point.lead ?? step.summary,
    history: point.lines?.(pebbles) ?? step.steps,
    historyLabel: "What to do",
    tips: point.lines ? undefined : [...(step.rules ?? []), ...(step.women ?? []), ...(step.avoid ?? [])],
    significance: step.evidence,
    sources: step.sources,
    position: point.at,
    view: 0,
  };
}
