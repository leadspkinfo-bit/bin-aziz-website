import type { HaramItem, Vec3 } from "@/lib/haramHistoricalData";

/**
 * Practical guidance for the start of the journey: packing at home, then each step at the home
 * airport. `ihram` is true when the flight lands in Jeddah and crosses the Miqat, so the Ihram has
 * to travel in the hand-carry. Written for pilgrims flying from Pakistan.
 */

export type PackItem = { id: string; label: string; detail: string; key?: boolean };

export function packingList(ihram: boolean): { group: string; items: PackItem[] }[] {
  return [
    {
      group: "Documents folder — keep it on you",
      items: [
        { id: "passport", label: "Original passport", detail: "Valid for at least six months after your return date. Photocopies are no substitute — the airline and immigration need the original." },
        { id: "visa", label: "Umrah visa", detail: "A printed copy of your e-visa, plus the PDF saved on your phone. Check that the name and passport number match your passport exactly." },
        { id: "ticket", label: "Air ticket", detail: "Your e-ticket with both legs — outbound and return. The check-in counter may ask to see the return flight." },
        { id: "hotels", label: "Hotel vouchers", detail: "One for Makkah and one for Madinah, with the dates matching your itinerary. Hotels ask for them at check-in." },
        {
          id: "transport",
          label: "Bin Aziz Transport Voucher",
          detail:
            "The most important paper after your passport. Our representative and the Saudi officials at arrivals check it before you board your Bin Aziz vehicle — and it covers every transfer on your route. Keep it in the front of your folder.",
          key: true,
        },
        { id: "copies", label: "Copies and contacts", detail: "Copies of your passport and CNIC, two passport photos, and the Bin Aziz helpline saved on your phone and written on paper." },
      ],
    },
    {
      group: ihram ? "Hand-carry — with you on the plane" : "Hand-carry",
      items: [
        ihram
          ? {
              id: "ihram",
              label: "Ihram in your hand-carry",
              detail:
                "Your flight crosses the Miqat before Jeddah, so you must be in Ihram on the plane. Pack the two sheets, a belt and open sandals in your hand-carry — not in checked luggage — so you can change at the airport.",
              key: true,
            }
          : {
              id: "ihram",
              label: "Ihram in your luggage",
              detail: "You land in Madinah first and put on Ihram later, at Dhul Hulayfah on the way to Makkah — so it can travel in your checked bag.",
            },
        { id: "medicine", label: "Medicines", detail: "Any regular medicines in their original packs, with a copy of the prescription." },
        { id: "toiletries", label: "Unscented toiletries", detail: "Perfume and scented soap are not allowed in Ihram — pack unscented soap, shampoo and deodorant." },
        { id: "power", label: "Phone, charger and power bank", detail: "Power banks must travel in the hand-carry; airlines do not allow them in checked baggage." },
        { id: "money", label: "Some riyals and a card", detail: "A little Saudi currency for the first day, and a card that works abroad." },
      ],
    },
  ];
}

export const LEAVING_DUA = {
  arabic: "بِسْمِ اللّٰهِ، تَوَكَّلْتُ عَلَى اللّٰهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ",
  transliteration: "Bismillāh, tawakkaltu ‘alallāh, wa lā ḥawla wa lā quwwata illā billāh.",
  meaning: "In the name of Allah; I put my trust in Allah; there is no power and no strength except through Allah. (Abu Dawud, Tirmidhi)",
};

export type AirportStep = { title: string; body: string[]; tips: string[] };

/** One block per part of the airport scene, in the same order as the avatar's route. */
export function airportSteps(ihram: boolean): AirportStep[] {
  return [
    {
      title: "Into departures",
      body: [
        "Reach the airport about three hours before an international flight. Show your passport and ticket at the entrance, take a trolley and head to your airline’s check-in counter.",
        "Drop your suitcases and collect your boarding pass. Your documents folder and the hand-carry stay with you.",
      ],
      tips: ["Weigh your bags at home — overweight fees are charged at the counter", ihram ? "Make sure the Ihram is in the hand-carry, not the suitcase" : "Check that your passport and visa are not in the checked bag"],
    },
    {
      title: "Immigration counter",
      body: [
        "This is where your passport is checked. The immigration officer (FIA, in Pakistan) looks at your passport, Umrah visa and boarding pass, may take your photo or fingerprints, and stamps your passport with the departure stamp.",
        "Hand over the documents together and answer simply — you are travelling for Umrah with Bin Aziz.",
      ],
      tips: ["Remove the passport cover before the counter", "Keep the boarding pass inside the passport"],
    },
    ihram
      ? {
          title: "Changing into Ihram",
          body: [
            "After security, go to the prayer room or the washroom set aside for Ihram. A ghusl at home before leaving is best; here, men put on the two white sheets and open sandals, women their usual modest clothes.",
            "If it is not a disliked time, pray two rak‘ahs of nafl. Do not make the Niyyah yet — that comes on the plane, before it crosses the Miqat.",
          ],
          tips: ["Fold your normal clothes into the hand-carry", "No perfume from here on, once you make the Niyyah"],
        }
      : {
          title: "No Ihram on this flight",
          body: [
            "You fly to Madinah first, so travel in your normal clothes. You will put on Ihram at Dhul Hulayfah (Abyar ‘Ali) when you leave Madinah for Makkah.",
          ],
          tips: ["Use the prayer room for any prayer due before boarding"],
        },
    {
      title: "Waiting in the lounge",
      body: [
        "Find a seat near your gate. Renew your wudu, pray any prayer that is due, and charge your phone.",
        ihram ? "Many pilgrims spend these minutes learning the Talbiyah by heart — you will say it for the first time on the plane." : "Use the time to read about the visit to Masjid an-Nabawi.",
      ],
      tips: ["Listen for the gate call", "Keep the documents folder in the same pocket every time"],
    },
    {
      title: "Boarding and your seat",
      body: [
        "Show your boarding pass and passport at the gate, walk down the jet bridge and find your seat.",
        ihram
          ? "Once in the air, the crew announces the Miqat about half an hour to forty-five minutes before landing in Jeddah. Be ready — that is when you make the Niyyah and begin the Talbiyah."
          : "Sit back — next stop, Madinah, where Bin Aziz meets you at arrivals.",
      ],
      tips: ["Keep your hand-carry under the seat in front, not in the overhead bin, if it holds your Ihram"],
    },
  ];
}

/** Where each airport step's + marker sits in AirportScene, in the same order as `airportSteps`. */
const AIRPORT_MARKERS: { label: string; at: Vec3 }[] = [
  { label: "Departures", at: [0, 3.3, 0] },
  { label: "Immigration counter", at: [0, 2.3, -10] },
  { label: "Ihram area", at: [3.7, 2, -22] },
  { label: "Lounge", at: [-3.8, 1.6, -33.5] },
  { label: "Boarding gate", at: [2.6, 1.6, -44] },
];

/** The airport's points of interest; open in the same detail card as the Haram's. */
export function airportPoints(ihram: boolean): (HaramItem & { label: string })[] {
  return airportSteps(ihram).map((step, i) => ({
    id: `airport-${i}`,
    label: AIRPORT_MARKERS[i].label,
    name: step.title,
    arabic: "",
    category: "At the airport",
    tagline: "What to do here",
    history: step.body,
    historyLabel: "What happens here",
    tips: step.tips,
    position: AIRPORT_MARKERS[i].at,
    view: 0,
  }));
}
