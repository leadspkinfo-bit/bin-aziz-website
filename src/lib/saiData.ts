import type { HaramItem } from "./haramHistoricalData";

/**
 * Points of interest in the 3D Mas‘a (the Sa’i gallery) on /umrah-guide. World coordinates in
 * SaiCanvas: Safa at −x, Marwah at +x. The model is stylised and shortened, not a survey.
 */
export const saiData: HaramItem[] = [
  {
    id: "safa",
    name: "Mount Safa",
    arabic: "الصَّفَا",
    category: "Safa & Marwah",
    tagline: "Where every Sa’i begins",
    history: [
      "A low rocky hill close to the Kaaba. Hajar (AS) climbed it to look for help when the water ran out and the infant Isma‘il (AS) lay thirsty in the valley.",
      "Only part of the original rock remains visible today, protected inside the Mas‘a.",
    ],
    significance: [{ text: "“Indeed, Safa and Marwah are among the symbols of Allah.”", source: "Qur’an 2:158" }],
    practice: "Climb a little, face the Kaaba, raise your hands in du‘a and begin. Sa’i starts here, as the Qur’an begins with Safa.",
    sources: [{ label: "Wikipedia — Al-Safa and Al-Marwah", url: "https://en.wikipedia.org/wiki/Al-Safa_and_Al-Marwah" }],
    position: [-41, 5, 0],
    view: 0,
  },
  {
    id: "marwah",
    name: "Mount Marwah",
    arabic: "الْمَرْوَة",
    category: "Safa & Marwah",
    tagline: "Where the seventh round ends",
    history: [
      "The second hill, facing Safa along the valley. Hajar (AS) went between the two seven times — the same seven rounds every pilgrim walks.",
      "After her seventh, the water of Zamzam burst from the ground beside Isma‘il (AS).",
    ],
    significance: [{ text: "The Prophet ﷺ described Hajar’s (AS) running between the two hills as the origin of Sa’i: “That is the going of the people between them.”", source: "Bukhari" }],
    practice: "Face the Kaaba and repeat the dhikr and du‘a. The Sa’i ends here on the seventh round; Halq or Taqsir comes next.",
    sources: [{ label: "Wikipedia — Al-Safa and Al-Marwah", url: "https://en.wikipedia.org/wiki/Al-Safa_and_Al-Marwah" }],
    position: [41, 5, 0],
    view: 0,
  },
  {
    id: "green-lights",
    name: "The green lights",
    arabic: "الْمِيلَانِ الْأَخْضَرَان",
    category: "Safa & Marwah",
    tagline: "Mark the valley floor where Hajar (AS) ran",
    history: [
      "Between the hills the ground once dipped into a valley, and there Hajar (AS) lost sight of her son — so she ran until she could see him again.",
      "The floor is level now; green lights overhead show where the valley was.",
    ],
    practice: "Men jog moderately between the lights on every round. Women walk at a normal pace throughout.",
    sources: [{ label: "Wikipedia — Sa’i", url: "https://en.wikipedia.org/wiki/Sa%27i" }],
    position: [0, 7.2, 0],
    view: 0,
  },
  {
    id: "masa",
    name: "The Mas‘a",
    arabic: "الْمَسْعَى",
    category: "Safa & Marwah",
    tagline: "The covered gallery between the hills, joined to Masjid al-Haram",
    history: [
      "For centuries the route was an open street with shops along it. In the Saudi expansions it was brought inside the mosque as a marble, air-cooled gallery on several floors.",
      "One way is about 450 metres, so the seven rounds come to roughly 3.2 km. Wheelchair lanes run down the middle.",
    ],
    practice: "Keep to the lane for your direction. If you tire, you may rest — Sa’i does not need wudu, though it is recommended.",
    sources: [{ label: "Wikipedia — Al-Safa and Al-Marwah", url: "https://en.wikipedia.org/wiki/Al-Safa_and_Al-Marwah" }],
    position: [-20, 6.4, -9],
    view: 0,
  },
];
