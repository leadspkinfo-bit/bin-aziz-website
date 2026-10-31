/**
 * Points of interest in the 3D Masjid al-Haram on /umrah-guide (Tawaf phase).
 *
 * Every entry has its own facts — nothing is repeated between entries. Figures come from the sources
 * listed on each entry; where sources disagree, the text says so instead of picking one silently.
 * Coordinates are world coordinates in KaabaCanvas (1 unit ≈ 2 m, Kaaba centred on the origin,
 * +x ≈ east, −z ≈ north). `position` is where the marker floats; `model.at` is where a small object
 * is drawn for entries that are not part of the Kaaba or the arcade themselves.
 */

export type Vec3 = [number, number, number];

export type HaramCategory = "The Kaaba" | "Inside the Kaaba" | "Around the Kaaba" | "Floor & fixtures" | "Architecture" | "Masjid an-Nabawi" | "Safa & Marwah" | "At the airport" | "Hajj";

export type HaramItem = {
  id: string;
  name: string;
  arabic: string;
  category: HaramCategory;
  tagline: string;
  /** When it was built, made or put in place */
  built?: string;
  materials?: string[];
  history: string[];
  /** Heading above `history`; "History" unless a card is practical guidance */
  historyLabel?: string;
  /** Short practical pointers */
  tips?: string[];
  timeline?: { date: string; event: string }[];
  /** Qur'an and hadith related to this place, each with its source */
  significance?: { text: string; source: string }[];
  /** What a pilgrim actually does here */
  practice?: string;
  sources?: { label: string; url: string }[];
  position: Vec3;
  /** Outward direction of the wall the marker sits on; the marker hides when that wall faces away */
  normal?: Vec3;
  /** Close-up camera distance when the visitor walks up to it */
  view: number;
  model?: { type: "dispenser" | "rehal" | "lantern" | "greenLight" | "saudiPillar" | "tile"; at: Vec3 };
  /** "inside" = only reachable after walking in through the door */
  space?: "inside" | "both";
  /** Label always shown on the 3D view (not only on hover) */
  pinned?: boolean;
  /** Short hover text under the label */
  tooltip?: string;
  /**
   * A real photograph from Wikimedia Commons. `src` uses Commons' Special:FilePath, which always
   * resolves to the current file; `page` is the file page, where the author and licence are listed.
   */
  image?: { src: string; page: string; caption: string; credit: string };
};

const commons = (file: string, caption: string, credit: string) => ({
  src: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1200`,
  page: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`,
  caption,
  credit,
});

export const haramCategories: HaramCategory[] = ["The Kaaba", "Inside the Kaaba", "Around the Kaaba", "Floor & fixtures", "Architecture"];

export const haramHistoricalData: HaramItem[] = [
  // ───────────── The Kaaba ─────────────
  {
    id: "black-stone",
    name: "Hajar al-Aswad",
    arabic: "الْحَجَرُ الْأَسْوَد",
    category: "The Kaaba",
    tagline: "The Black Stone — every round of Tawaf begins and ends here",
    built: "Set in the eastern corner by Ibrahim (AS); held in a silver frame since the first Islamic century",
    materials: ["Stone, now in several fragments", "Silver mount fixed to the wall with silver nails"],
    history: [
      "Before Prophethood, the clans of Quraysh nearly fought over who would set the stone back in the rebuilt wall. The young Muhammad ﷺ placed it on a cloak, had a man from every clan lift together, and set it in place himself.",
      "The stone cracked in the fire of 64 AH (683 CE). ‘Abdullah ibn al-Zubayr is credited with first binding the pieces in silver — the tradition of the silver frame starts there.",
      "The present mount measures about 75 × 78 cm and holds the fragments together on the corner of the Kaaba.",
    ],
    timeline: [
      { date: "683 CE", event: "Cracked in the siege fire; bound in silver for the first time" },
      { date: "1955–56", event: "King Sa‘ud replaces the old frame with a new silver one" },
      { date: "1417 AH / 1996", event: "Current silver mount made during King Fahd’s restoration of the Kaaba" },
    ],
    significance: [
      { text: "It came down from Paradise whiter than milk, and the sins of the children of Adam turned it black.", source: "Tirmidhi" },
      { text: "On the Day of Resurrection it will testify in favour of everyone who touched it in truth.", source: "Tirmidhi, Ibn Majah" },
    ],
    practice: "Kiss it only if you can reach it without pushing anyone. Otherwise face it, raise your hands, say “Bismillāhi Allāhu akbar” and kiss your palms — the sunnah is the same.",
    sources: [
      { label: "Wikipedia — Black Stone", url: "https://en.wikipedia.org/wiki/Black_Stone" },
      { label: "Islamic Arts Biennale — Mount of the Black Stone", url: "https://qr.biennale.org.sa/silver-mount/" },
    ],
    position: [4.88, 1.4, -0.14],
    normal: [1, 0, 0],
    view: 7,
  },
  {
    id: "door",
    name: "Door of the Kaaba",
    arabic: "بَابُ الْكَعْبَة",
    category: "The Kaaba",
    tagline: "A gold door, about two metres above the ground",
    built: "Installed 13 October 1979 on the order of King Khalid",
    materials: ["About 280 kg of 99.99% pure gold (some sources give 300 kg)"],
    history: [
      "Crafted by the Makkah jeweller Ahmad bin Ibrahim Badr; the design is credited to the Syrian engineer Muneer al-Jundi.",
      "Its cost was reported at SAR 13.42 million — not counting the gold.",
      "It sits high in the north-eastern wall, so a wheeled staircase is brought up whenever it is opened, for example for the washing of the Kaaba.",
      "The stretch of wall between this door and the Black Stone is the Multazam.",
    ],
    timeline: [{ date: "1979", event: "Present gold door installed" }],
    significance: [{ text: "The Prophet ﷺ pressed his chest, face and forearms against the Multazam while making du‘a.", source: "Abu Dawud, Ibn Majah" }],
    practice: "After Tawaf, if there is room, hold the Multazam and make du‘a. In the crowds, face it from a distance — the du‘a is just as valid.",
    sources: [
      { label: "Wikipedia — Ahmad bin Ibrahim Badr", url: "https://en.wikipedia.org/wiki/Ahmad_bin_Ibrahim_Badr" },
      { label: "Gulf News — designer of the Kaaba door", url: "https://gulfnews.com/world/gulf/saudi/designer-of-holy-kaabas-door-dies-in-germany-1.76064422" },
      { label: "Saudipedia — gold in the Kaaba door", url: "https://saudipedia.com/en/what-is-the-weight-of-the-gold-in-the-door-of-al-kaaba-al-musharrafa-and-bab-al-tawbah" },
    ],
    position: [3.57, 3.3, -1.38],
    normal: [0.71, 0, -0.71],
    view: 9,
    image: commons(
      "Kiswah of the Golden Door of Kaaba - 2016.jpg",
      "The golden door behind its embroidered curtain, 2016",
      "Pixabay, via Wikimedia Commons — CC0",
    ),
  },
  {
    id: "door-curtain",
    name: "Curtain of the door (sitara)",
    arabic: "سِتَارَةُ بَابِ الْكَعْبَة",
    category: "The Kaaba",
    tagline: "The most richly embroidered piece of the Kiswa",
    built: "Woven with each new Kiswa; old curtains survive in museums and mosques",
    materials: ["Black silk", "Gold- and silver-plated embroidery"],
    history: [
      "A sitara is an ornamental curtain hung over a sacred doorway. The one over the Kaaba’s door is made separately from the rest of the Kiswa and carries the densest embroidery of all.",
      "Old curtains became treasured gifts. One from 1517 — sent from Makkah after Sultan Selim I took Egypt and the Hijaz in 1516 — hung on a wall of the Grand Mosque (Ulu Camii) of Bursa, Turkey, for centuries.",
      "That Bursa curtain was restored in 2009 and is now kept in a glass case.",
    ],
    timeline: [
      { date: "1517", event: "Curtain sent from Makkah to the Ottoman lands" },
      { date: "2009", event: "Restored and placed under glass in Bursa" },
    ],
    sources: [
      { label: "Wikimedia Commons — Sitaras (textiles)", url: "https://commons.wikimedia.org/wiki/Category:Sitaras_(textiles)" },
      { label: "Wikimedia Commons — Kaaba curtain in Ulu Camii", url: "https://commons.wikimedia.org/wiki/File:Ulu_Camii_-_Kaaba_Curtain_-_Kabe_%C3%96rt%C3%BCs%C3%BC_(3).jpg" },
    ],
    position: [3.39, 4.85, -1.2],
    normal: [0.71, 0, -0.71],
    view: 8,
    image: commons(
      "Ulu Camii - Kaaba Curtain - Kabe Örtüsü (3).jpg",
      "Kaaba door curtain of 1517, Ulu Camii, Bursa",
      "Wikimedia Commons — author and licence on the file page",
    ),
  },
  {
    id: "kiswa",
    name: "The Kiswa",
    arabic: "كِسْوَةُ الْكَعْبَة",
    category: "The Kaaba",
    tagline: "About 670 kg of silk, woven new every year",
    built: "Made each year at the King Abdulaziz Complex for the Holy Kaaba Kiswa, Umm al-Joud — about 17 km from the Haram",
    materials: ["About 670 kg of silk, dyed black", "About 120 kg of 21-carat gold thread", "About 100 kg of silver thread"],
    history: [
      "The finished Kiswa is 47 pieces covering about 658 m² and weighs roughly 1,415 kg. Making one takes eight to ten months.",
      "Its gold band runs around the upper walls with verses of the Qur’an embroidered in gold- and silver-plated thread.",
      "The Saudi workshop began in Ajyad, moved to al-Tayseer and later to its present home in Umm al-Joud.",
      "In the Hajj season the lower part is raised and the walls are wrapped in white cloth tied with ropes — the look shown in this model.",
    ],
    timeline: [
      { date: "Before Islam", event: "The Kaaba is already covered in cloth; the Prophet ﷺ keeps the practice" },
      { date: "1444 AH / 2022", event: "The change of the Kiswa moves to the start of Muharram" },
      { date: "Every year", event: "A new Kiswa is woven and the old one is cut and given away" },
    ],
    significance: [
      { text: "“Indeed, the first House set up for mankind is the one at Bakkah — blessed, and a guidance for all the worlds.”", source: "Qur’an 3:96" },
      { text: "“Allah has made the Kaaba, the Sacred House, a means of support for mankind.”", source: "Qur’an 5:97" },
    ],
    practice: "Don’t pull at the Kiswa or take threads from it — it is a trust for every pilgrim who comes after you.",
    sources: [
      { label: "Arab News — how the Kiswa is made", url: "https://www.arabnews.pk/node/2119016" },
      { label: "The Islamic Information — Kiswa 1448 AH", url: "https://theislamicinformation.com/?p=71660" },
      { label: "Al Jazeera — the story of the Kiswah", url: "https://www.aljazeera.com/amp/features/2026/5/25/whats-inside-the-kaaba-and-what-covers-it-the-story-of-the-kiswah" },
    ],
    position: [2.26, 5.64, 2.26],
    normal: [0.71, 0, 0.71],
    view: 10,
  },
  {
    id: "kaaba-walls",
    name: "Walls of the Kaaba",
    arabic: "جُدْرَانُ الْكَعْبَة",
    category: "The Kaaba",
    tagline: "The building standing today dates from 1630",
    built: "Rebuilt in 1039 AH / 1630 CE on the order of the Ottoman Sultan Murad IV",
    materials: ["Stone masonry, hidden beneath the Kiswa"],
    history: [
      "Heavy rain and flooding brought parts of the walls down. Murad IV, as Servant of the Two Holy Sanctuaries, ordered the House rebuilt so that the pilgrimage could continue.",
      "The decision was debated at length between scholars and officials of the time, and an eyewitness, Sayyid Zayn al-‘Abidin, recorded the rebuilding day by day.",
      "The Kaaba had been rebuilt before — by Quraysh in the Prophet’s ﷺ youth and again in the first Islamic century — but most of what stands now is this Ottoman work.",
    ],
    timeline: [
      { date: "Time of Ibrahim (AS)", event: "Foundations raised by Ibrahim and Isma‘il (AS)" },
      { date: "Early 7th century", event: "Rebuilt by Quraysh" },
      { date: "1039 AH / 1630", event: "Rebuilt under Sultan Murad IV after the flood" },
    ],
    significance: [{ text: "“And when Ibrahim was raising the foundations of the House, with Isma‘il: ‘Our Lord, accept this from us.’”", source: "Qur’an 2:127" }],
    sources: [
      { label: "Qatar National Library — architecture of the Kaaba", url: "https://exhibits.qnl.qa/en/the-architecture-of-the-holy-kaaba/" },
      { label: "Religions (MDPI) — rebuilding under Murad IV", url: "https://www.mdpi.com/2077-1444/16/7/915" },
    ],
    position: [-2.26, 3.0, 2.26],
    normal: [-0.71, 0, 0.71],
    view: 11,
  },
  {
    id: "mizab",
    name: "Mizab ar-Rahmah",
    arabic: "مِيزَابُ الرَّحْمَة",
    category: "The Kaaba",
    tagline: "The gold rain spout on the north-western roof edge",
    built: "Present spout installed 1417 AH / 1997 under King Fahd",
    materials: ["Gold-covered metal"],
    history: [
      "It drains the flat roof of the Kaaba, pouring rainwater into the Hijr Isma‘il below.",
      "King Fahd’s spout is a stronger copy made to the same specifications as the one it replaced.",
      "That older spout had been commissioned by the Ottoman Sultan Abdülmecid I in 1856, made in Constantinople and installed in 1276 AH / 1859.",
    ],
    timeline: [
      { date: "16th–17th century", event: "Ottoman sultans, among them Ahmed I, send replacement spouts" },
      { date: "1859", event: "Abdülmecid I’s spout installed" },
      { date: "1997", event: "Replaced under King Fahd" },
    ],
    significance: [{ text: "No specific virtue is authentically reported for the spout itself.", source: "Note" }],
    practice: "When you pray nafl inside the Hijr (outside your Tawaf), the spout is directly above you — a quiet place for your own du‘a.",
    sources: [
      { label: "Wikipedia — Mizab al-Rahma", url: "https://en.wikipedia.org/wiki/Mizab_al-Rahma" },
      { label: "Khalili Collections — Ottoman spout", url: "https://www.khalilicollections.org/?p=985" },
    ],
    position: [-2.47, 7.25, -2.47],
    normal: [-0.63, 0.45, -0.63],
    view: 9,
  },
  {
    id: "shadharwan",
    name: "Shadharwan",
    arabic: "الشَّاذَرْوَان",
    category: "The Kaaba",
    tagline: "The sloping marble skirt at the foot of the walls",
    built: "Last renewed in 2016 under King Salman",
    materials: ["About 36 marble slabs, each roughly 7 cm thick", "Gold-coloured rings that hold down the Kiswa"],
    history: [
      "It runs along the base of three walls and protects them from rainwater. There is none along the Hijr side or beneath the door.",
      "The lower edge of the Kiswa is tied to its rings.",
      "In the 2016 renovation the old marble was replaced with stone matching the colours of the Haram, and the rings were renewed.",
    ],
    timeline: [{ date: "2016", event: "Marble replaced and Kiswa rings renewed" }],
    practice: "During Tawaf keep your feet on the mataf floor — walk outside the Shadharwan, not on it.",
    sources: [
      { label: "Saudipedia — Al-Kaaba’s Shadherwaan", url: "https://saudipedia.com/en/article/1663/religion/the-grand-mosque/al-kaabas-shadherwaan" },
      { label: "The Pilgrim — the Shadharwan", url: "https://thepilgrim.co/alabaster-stones-of-the-kaaba/" },
    ],
    position: [3.5, 0.45, 1.38],
    normal: [0.71, 0, 0.71],
    view: 6,
  },
  {
    id: "rukn-yamani",
    name: "Rukn al-Yamani",
    arabic: "الرُّكْنُ الْيَمَانِي",
    category: "The Kaaba",
    tagline: "The southern corner — touched, never kissed",
    built: "Stands on the foundations laid by Ibrahim (AS)",
    materials: ["Corner of the Kaaba’s stone walls"],
    history: [
      "It faces Yemen, which gives it its name, and is the last corner you pass before returning to the Black Stone.",
      "It and the Black Stone corner are the two corners still on Ibrahim’s (AS) original foundations — the other two moved when the Hijr was left outside the walls.",
    ],
    timeline: [{ date: "Time of the Prophet ﷺ", event: "He touches only this corner and the Black Stone corner" }],
    significance: [
      { text: "Ibn ‘Umar (RA): “I never saw the Prophet ﷺ touch anything of the House except the two Yemeni corners.”", source: "Bukhari, Muslim" },
      { text: "Touching the Black Stone and the Rukn Yamani wipes away sins.", source: "Tirmidhi" },
    ],
    practice: "Touch it with your right hand if you can reach it easily. Don’t kiss it and don’t point at it — walk on, reciting “Rabbana atina…”.",
    sources: [{ label: "Wikipedia — Kaaba", url: "https://en.wikipedia.org/wiki/Kaaba" }],
    position: [-0.14, 1.85, 4.88],
    normal: [0, 0, 1],
    view: 7,
  },

  // ───────────── Inside the Kaaba ─────────────
  {
    id: "pillars",
    name: "The three wooden pillars",
    arabic: "الْأَعْمِدَةُ الثَّلَاثَة",
    category: "Inside the Kaaba",
    tagline: "Dark wooden columns that carry the roof",
    built: "Attributed to ‘Abdullah ibn al-Zubayr’s rebuilding (first Islamic century); some writers date the present columns to later restorations",
    materials: ["Very hard, dark brown wood — often called teak, though that is not confirmed", "Carved square wooden bases"],
    history: [
      "Three pillars stand in a row inside the room and hold up the roof. Each is reported to be about 44 cm across, roughly 150 cm round, standing on an engraved wooden base.",
      "Most accounts credit them to Ibn al-Zubayr, who added them for extra support. Others say the columns seen today come from the restorations of recent centuries — the record is not settled.",
      "A metal bar runs between the pillars near the top; the lamps hang from it. Some descriptions wrongly speak of only two pillars.",
    ],
    timeline: [
      { date: "1st century AH", event: "Pillars installed in Ibn al-Zubayr’s rebuilding (traditional attribution)" },
      { date: "Today", event: "Still carrying the roof of the room" },
    ],
    significance: [
      { text: "Bilal (RA) told Ibn ‘Umar that the Prophet ﷺ prayed inside the Kaaba, with one pillar on his left, one on his right and three behind him — the House then stood on six pillars.", source: "Bukhari" },
    ],
    sources: [
      { label: "Al Arabiya — what the Kaaba’s interior looks like", url: "https://english.alarabiya.net/features/2016/12/04/What-the-Kaaba-s-interior-looks-like" },
      { label: "Makkah Newspaper — the wooden pillars", url: "https://makkahnewspaper.com/article/1587054" },
      { label: "Wikipedia — Kaaba", url: "https://en.wikipedia.org/wiki/Kaaba" },
    ],
    position: [-0.35, 3.6, -0.35],
    view: 0,
    space: "inside",
    image: commons(
      "Bagian Dalam Kabbah MekKah Arab Saudi.jpg",
      "Photograph of the Kaaba’s interior",
      "Wikimedia Commons — author and licence on the file page",
    ),
  },
  {
    id: "interior-lamps",
    name: "Hanging lamps",
    arabic: "قَنَادِيلُ الْكَعْبَة",
    category: "Inside the Kaaba",
    tagline: "Gifts of rulers, hung between the pillars",
    built: "Given over many centuries; some are dated to the Ottoman period",
    materials: ["Gold, silver, copper or brass — accounts differ", "Glass", "Some engraved with Qur’anic verses and donors’ names"],
    history: [
      "Lamps of precious metal hang from the bar between the pillars. Muslim rulers and benefactors sent them as gifts to the House of Allah.",
      "They were once lit with oil; today they are kept as heritage rather than used for light.",
      "Some of these objects may be censers for incense rather than lamps — even careful descriptions hesitate. No authoritative public inventory of who gave each one exists.",
    ],
    timeline: [
      { date: "Ottoman period", event: "Several of the surviving lamps are dated to this era" },
      { date: "Today", event: "Kept as symbols, no longer lit" },
    ],
    sources: [
      { label: "Madain Project — Kaaba interior", url: "https://madainproject.com/kabah_(interior)" },
      { label: "Wikipedia — Kaaba (interior)", url: "https://en.wikipedia.org/wiki/Kaaba" },
    ],
    position: [0.07, 4.85, -0.78],
    view: 0,
    space: "inside",
    image: commons(
      "Bagian Dalam Kabbah Mekkah Arab Saudi.jpg",
      "Another photograph of the interior",
      "Wikimedia Commons — author and licence on the file page",
    ),
  },
  {
    id: "bab-al-tawbah",
    name: "Bab al-Tawbah",
    arabic: "بَابُ التَّوْبَة",
    category: "Inside the Kaaba",
    tagline: "The Door of Repentance, leading up to the roof",
    built: "Made in pure gold on the order of King Khalid (directive of 1397 AH / 1977), alongside the outer door",
    materials: ["Gold-clad door", "Staircase behind it — wooden originally, later metal"],
    history: [
      "A small door in the north corner, beside the main entrance. Behind it a staircase climbs to the space between the Kaaba’s lower and upper ceilings and out onto the roof.",
      "In 1397 AH, when the outer door made under King ‘Abd al-‘Aziz had served for 34 years, King Khalid ordered a new one — and gave instructions for Bab al-Tawbah to be made of pure gold as well.",
      "One account says the old wooden stairs were replaced in 1977 by a circular aluminium staircase of fifty steps. Together, the outer door and Bab al-Tawbah are reported to hold more than 280 kg of gold.",
    ],
    timeline: [
      { date: "1397 AH / 1977", event: "King Khalid orders the door made of gold" },
      { date: "1977", event: "Wooden stairs reportedly replaced by an aluminium spiral staircase" },
    ],
    sources: [
      { label: "Arab News — the doors of the Kaaba", url: "https://www.arabnews.com/news/457960" },
      { label: "Saudipedia — internal elements of the Kaaba", url: "https://saudipedia.com/en/list-of-the-internal-elements-of-al-kaaba-al-musharrafa" },
      { label: "Saudi Gazette — gold in the Kaaba doors", url: "https://www.saudigazette.com.sa/article/623860" },
    ],
    position: [-0.3, 3.1, -3.27],
    normal: [0.71, 0, 0.71],
    view: 0,
    space: "inside",
  },
  {
    id: "inner-cloth",
    name: "Green cloth of the upper walls",
    arabic: "كِسْوَةُ الْكَعْبَةِ الدَّاخِلِيَّة",
    category: "Inside the Kaaba",
    tagline: "The inner Kiswa, embroidered with verses",
    built: "Hung above the marble on the inner walls",
    materials: ["Silk — green in most recent descriptions", "Embroidered Qur’anic inscriptions"],
    history: [
      "Above the marble, the walls are covered with cloth embroidered with verses of the Qur’an; some describe it continuing over the ceiling.",
      "Its colour is reported differently: most recent accounts say green, Wikipedia describes a dark cloth with gold lettering, and older reports mention red silk. It has evidently changed over time.",
    ],
    timeline: [{ date: "Varies", event: "Replaced from time to time; colour reported as red, black or green in different periods" }],
    sources: [
      { label: "The Pilgrim — what is inside the Kaaba", url: "https://thepilgrim.co/what-is-inside-the-kaaba/" },
      { label: "Wikipedia — Kaaba (interior)", url: "https://en.wikipedia.org/wiki/Kaaba" },
    ],
    position: [-1.93, 5.4, 1.93],
    normal: [0.71, 0, -0.71],
    view: 0,
    space: "inside",
  },
  {
    id: "plaques",
    name: "Marble plaques",
    arabic: "اللَّوْحَاتُ الرُّخَامِيَّة",
    category: "Inside the Kaaba",
    tagline: "A history of the Kaaba written on its own walls",
    built: "Added after each major renovation, from the Abbasid era to the present",
    materials: ["Inscribed marble"],
    history: [
      "About ten inscribed marble plaques are set into the inner walls. Each records a renovation and the ruler who carried it out — Abbasid, Ottoman and Saudi among them.",
      "Some also note restorations made after floods or structural damage.",
      "One of the most recent bears King Fahd’s record of the comprehensive restoration of 1996.",
    ],
    timeline: [
      { date: "Abbasid era", event: "Earliest renovation plaques among those described" },
      { date: "1996", event: "King Fahd’s restoration recorded in marble" },
    ],
    significance: [{ text: "“The mosques of Allah are only maintained by those who believe in Allah and the Last Day.”", source: "Qur’an 9:18" }],
    sources: [
      { label: "Saudipedia — internal elements of the Kaaba", url: "https://saudipedia.com/en/list-of-the-internal-elements-of-al-kaaba-al-musharrafa" },
      { label: "Islamic Landmarks — inside the Kaaba", url: "https://www.islamiclandmarks.com/?p=736" },
    ],
    position: [1.79, 2.75, 1.79],
    normal: [-0.71, 0, -0.71],
    view: 0,
    space: "inside",
  },
  {
    id: "interior-floor",
    name: "Marble floor & the washing",
    arabic: "غَسْلُ الْكَعْبَة",
    category: "Inside the Kaaba",
    tagline: "Washed with Zamzam and perfumed by hand",
    built: "White marble floor and lower walls",
    materials: ["White marble", "Zamzam water, rose water and perfume for the washing"],
    history: [
      "The room is floored with marble, and marble covers the lower walls to about two metres.",
      "At the washing ceremony the floor is splashed with Zamzam water and the inner walls are wiped by hand with perfumes.",
    ],
    timeline: [{ date: "Every year", event: "The inside of the Kaaba is washed" }],
    significance: [{ text: "“And purify My House for those who circle it, those who stand, and those who bow and prostrate.”", source: "Qur’an 22:26" }],
    sources: [{ label: "Wikimedia Commons — Kaaba washing ceremony", url: "https://commons.wikimedia.org/wiki/File:Kaaba_washing_ceremony_(IMG19215807).jpg" }],
    position: [0, 2.25, 1.7],
    view: 0,
    space: "inside",
    image: commons(
      "Kaaba washing ceremony (IMG19215807).jpg",
      "The washing ceremony of the Kaaba",
      "Wikimedia Commons — author and licence on the file page",
    ),
  },
  {
    id: "kaaba-key",
    name: "Key of the Kaaba",
    arabic: "مِفْتَاحُ الْكَعْبَة",
    category: "Inside the Kaaba",
    tagline: "Held by one family since the conquest of Makkah",
    built: "Custodianship (sidana) of Banu Shaybah, confirmed by the Prophet ﷺ in 8 AH",
    materials: ["Keys of iron or precious metal, often inscribed — many survive in museums"],
    history: [
      "On the day Makkah was conquered, the key was with ‘Uthman ibn Talha, who was not yet Muslim. The Prophet ﷺ took it to open the House — and then gave it back to him.",
      "Commentators connect the return of the key with the verse “Allah commands you to render trusts to whom they are due”.",
      "When ‘Uthman died without heirs, the custody passed to his cousin Shaybah ibn ‘Uthman; it has remained in that family, the Banu Shaybah (al-Shaibi), ever since.",
      "Historic keys and locks are kept in collections around the world. The Louvre holds an iron key inlaid with gold and silver bearing the name of the Mamluk Sultan Faraj ibn Barquq (early 15th century), acquired in 1914.",
    ],
    timeline: [
      { date: "8 AH / 630", event: "Key returned to ‘Uthman ibn Talha after the conquest" },
      { date: "Early 15th century", event: "Key made in the name of Sultan Faraj ibn Barquq (now Louvre OA 6738)" },
      { date: "Today", event: "Custody still held by the al-Shaibi family" },
    ],
    significance: [{ text: "“Indeed, Allah commands you to render trusts to whom they are due.”", source: "Qur’an 4:58" }],
    sources: [
      { label: "Wikipedia — Bani Shaiba", url: "https://en.wikipedia.org/wiki/Bani_Shaiba" },
      { label: "Saudi Gazette — keepers of the Kaaba key", url: "https://saudigazette.com.sa/article/516736" },
      { label: "Wikimedia Commons — Key Barkuk (Louvre OA 6738)", url: "https://commons.wikimedia.org/wiki/Category:Key_Barkuk_(Louvre_OA_6738)" },
    ],
    position: [2.93, 3.3, -0.74],
    normal: [-0.71, 0, 0.71],
    view: 0,
    space: "inside",
    image: commons(
      "Key Barkuk Louvre OA6738.jpg",
      "Kaaba key in the name of Sultan Faraj ibn Barquq, Egypt, early 15th century — Louvre OA 6738",
      "Wikimedia Commons — author and licence on the file page",
    ),
  },

  // ───────────── Around the Kaaba ─────────────
  {
    id: "hateem",
    name: "Hateem — Hijr Isma‘il",
    arabic: "الْحَطِيم · حِجْرُ إِسْمَاعِيل",
    category: "Around the Kaaba",
    tagline: "A semicircle that belongs to the House itself",
    built: "Left open when Quraysh rebuilt the Kaaba; enclosed by a low white marble wall",
    materials: ["White marble wall — about 0.9 m to 1.3 m high (sources differ)"],
    history: [
      "When Quraysh rebuilt the Kaaba they did not have enough wealth from pure, halal sources to cover all of Ibrahim’s (AS) foundations, so this part was left outside the walls and marked with a curved wall.",
      "Openings at both ends let people walk in and pray inside it.",
    ],
    timeline: [{ date: "Early 7th century", event: "Quraysh leave this area outside the rebuilt walls" }],
    significance: [
      { text: "“Pray in the Hijr if you wish to enter the House, for it is part of the House.” — said to ‘A’ishah (RA).", source: "Tirmidhi, Nasa’i" },
      { text: "A prayer in Masjid al-Haram is worth 100,000 prayers elsewhere.", source: "Ibn Majah, Ahmad" },
    ],
    practice: "Tawaf goes around the outside of the Hateem — a round walked through it does not count.",
    sources: [{ label: "Wikipedia — Kaaba (Hatim)", url: "https://webarchive.library.unt.edu/web/20161119121319/https://en.wikipedia.org/wiki/Kaaba" }],
    position: [-4.7, 1.1, -4.7],
    view: 9,
  },
  {
    id: "maqam",
    name: "Maqam-e-Ibrahim",
    arabic: "مَقَامُ إِبْرَاهِيم",
    category: "Around the Kaaba",
    tagline: "The stone that carries the footprints of Ibrahim (AS)",
    built: "Present case from 1998; under glass since 1967",
    materials: ["The stone itself, with the footprints", "Crystal glass dome", "Gold-plated brass case", "Base of white marble and green granite"],
    history: [
      "Ibrahim (AS) stood on this stone while raising the walls with Isma‘il (AS); his footprints are still visible in it.",
      "Until the 1960s the stone stood inside a larger roofed enclosure (maqsurah) that narrowed the mataf. King Faisal began removing it in 1965 to give pilgrims more room.",
      "A crystal dome was then placed over the stone so it stays visible but protected.",
    ],
    timeline: [
      { date: "1965", event: "Removal of the old enclosure begins under King Faisal" },
      { date: "1967", event: "Stone placed under a crystal glass dome" },
      { date: "1998", event: "New gold-plated brass case installed" },
    ],
    significance: [
      { text: "“And take the station of Ibrahim as a place of prayer.”", source: "Qur’an 2:125" },
      { text: "After his Tawaf the Prophet ﷺ recited this verse and prayed two rak‘ahs behind the Maqam.", source: "Sahih Muslim" },
      { text: "The Black Stone and the Maqam are two rubies from the rubies of Paradise.", source: "Tirmidhi" },
    ],
    practice: "Pray the two rak‘ahs of Tawaf with the Maqam between you and the Kaaba. In the crowds, pray further back — never block those still in Tawaf.",
    sources: [
      { label: "Saudipedia — timeline of Maqam Ibrahim", url: "https://saudipedia.com/en/timeline-of-maqam-ibrahim-in-the-grand-mosque" },
      { label: "Islamic Arts Biennale — Maqam Ibrahim", url: "https://qr.biennale.org.sa/maqam-ibrahim" },
    ],
    position: [6.22, 2.6, -4.1],
    view: 6,
  },
  {
    id: "zamzam-well",
    name: "Zamzam well",
    arabic: "بِئْرُ زَمْزَم",
    category: "Around the Kaaba",
    tagline: "The blessed well, a few metres east of the Kaaba",
    built: "Opening moved into a basement about 2.7 m below the mataf during King Sa‘ud’s expansion",
    materials: ["Well shaft, now enclosed behind glass beneath the floor"],
    history: [
      "When Hajar (AS) ran between Safa and Marwah looking for water for the infant Isma‘il (AS), Allah sent Jibril (AS) and water burst from the ground here.",
      "For years pilgrims walked down stairs to a basement — divided into men’s and women’s sections — to drink at the well.",
      "The basement entrances were later roofed over to free the mataf for Tawaf. The well now sits behind glass and the public can no longer go down to it.",
    ],
    timeline: [
      { date: "Time of Ibrahim (AS)", event: "Water bursts out for Hajar and Isma‘il" },
      { date: "From 1955", event: "Opening lowered into a basement below the mataf" },
      { date: "Later", event: "Basement entrances roofed over; access closed" },
    ],
    significance: [{ text: "“It is blessed; it is food that nourishes.”", source: "Sahih Muslim" }],
    sources: [
      { label: "Saudipedia — Zamzam well timeline", url: "https://saudipedia.com/en/article/3924/religion/the-grand-mosque/timeline-of-zamzam-well-development-during-the-saudi-reign" },
      { label: "Saudipedia — how deep is Zamzam well", url: "https://saudipedia.com/en/article/3555/religion/the-grand-mosque/how-deep-is-zamzam-well" },
      { label: "Arab News — Tawaf area", url: "https://www.arabnews.com/blocks-tawaf-area-removed" },
    ],
    position: [8.49, 0.8, -0.85],
    view: 6,
  },

  // ───────────── Floor & fixtures ─────────────
  {
    id: "mataf-marble",
    name: "Thassos marble of the mataf",
    arabic: "رُخَامُ الْمَطَاف",
    category: "Floor & fixtures",
    tagline: "White marble from a Greek island that stays cool under bare feet",
    built: "First laid when King Khalid expanded the mataf in 1398 AH / 1978",
    materials: ["Thassos marble — quarried on the island of Thassos, Greece"],
    history: [
      "Thassos marble is exceptionally white and reflects much of the sun’s heat, so the mataf stays walkable barefoot even at midday in a Makkah summer.",
      "Many pilgrims assume water pipes run beneath it. When the floor was dug up for maintenance, no such pipes were found.",
      "Long before marble, the mataf was paved with stones and pebbles; marble came in stages in the Umayyad and Abbasid periods.",
    ],
    timeline: [
      { date: "Umayyad & Abbasid eras", event: "Stone and pebble paving gradually covered with marble" },
      { date: "1978", event: "Thassos marble laid in King Khalid’s mataf expansion" },
    ],
    sources: [
      { label: "Siasat — heat-resistant marble", url: "https://archive.siasat.com/news/heat-resistant-marble-holy-haram-courtyards-272285" },
      { label: "Zawya — why the mataf stays cool", url: "https://zawya.com/en/life/culture/what-is-the-secret-behind-coolness-of-mataf-in-makkah-even-in-searing-temperatures-jefzjyvj" },
      { label: "Islamic Landmarks — Mataf", url: "https://www.islamiclandmarks.com/makkah-haram-sharief/mataf" },
    ],
    position: [11, 0.25, 7],
    view: 4,
    model: { type: "tile", at: [11, 0, 7] },
  },
  {
    id: "tawaf-start",
    name: "Start of Tawaf marker",
    arabic: "بِدَايَةُ الطَّوَاف",
    category: "Floor & fixtures",
    tagline: "From a brown marble line to green lights",
    built: "Green lights and gilded Kiswa panels since 2016",
    materials: ["Green lights on the upper floors", "Gilded lantern-shaped panels on the Kiswa above the Black Stone"],
    history: [
      "For years a brown line ran across the mataf floor from the Black Stone to show where each round begins.",
      "Pilgrims stopped on it to start their rounds and it caused congestion, so it was removed in 2016.",
      "Now green lights on the upper floors face the Black Stone, and four gilded lantern-shaped panels embroidered with “Allāhu akbar” mark it on the Kiswa.",
    ],
    timeline: [
      { date: "Time of the Prophet ﷺ", event: "No line — he began in line with the Black Stone" },
      { date: "Until 2016", event: "Brown line across the mataf" },
      { date: "2016", event: "Line removed; gilded panels and green lights mark the start" },
    ],
    significance: [{ text: "Scholars note the line did not exist in the Prophet’s ﷺ time; what counts is starting in line with the Black Stone.", source: "Islamweb fatwa 89598" }],
    practice: "Look for the green light, line up with the Black Stone corner, make your intention, and start — no need to stop and search for a mark.",
    sources: [
      { label: "Ummid — new signs on the Kiswa (2016)", url: "https://ummid.com/news/2016/November/15.11.2016/kaaba-kiswa-added-with-new-signs.html" },
      { label: "Ministry of Hajj — Tawaf", url: "https://haj.gov.sa/en/Hajj/Tawaf" },
      { label: "Islamweb — the line at the Black Stone", url: "https://www.islamweb.net/en/printfatwa.php?id=89598" },
    ],
    position: [26.6, 4.7, 0],
    view: 6,
    model: { type: "greenLight", at: [26.6, 4.0, 0] },
  },
  {
    id: "zamzam-dispenser",
    name: "Zamzam coolers",
    arabic: "سُقْيَا زَمْزَم",
    category: "Floor & fixtures",
    tagline: "Where the well’s water reaches every pilgrim",
    built: "Supplied since 2010 by the King Abdullah bin Abdulaziz Zamzam Water Project, Kudai, Makkah",
    materials: ["Insulated coolers with taps", "Purification and bottling plant in Kudai"],
    history: [
      "King Abdullah opened the SR700 million plant on 3 September 2010, pressing the button himself and drinking the first water.",
      "Raw water is pumped from the well to Kudai at about 360 m³ an hour, purified and stored, then sent back to the coolers and filling points around the Haram.",
      "The same plant fills the 5-litre bottles pilgrims take home — more than 2.2 million were prepared for Hajj 2023. It is run by the National Water Company.",
      "For centuries before this, water carriers brought Zamzam to pilgrims by hand.",
    ],
    timeline: [
      { date: "Centuries", event: "Water carriers serve Zamzam to pilgrims" },
      { date: "2010", event: "Kudai purification and distribution plant opens" },
    ],
    practice: "Drink in three breaths, beginning with Bismillah. Use the cups provided and drop them in the bins beside the cooler.",
    sources: [
      { label: "Zawya — king opens Zamzam project (2010)", url: "https://www.zawya.com/en/business/king-opens-zamzam-water-project-in-makkah-gt9njbdx" },
      { label: "Arab News — centuries of serving Zamzam", url: "https://www.arabnews.pk/node/2644981" },
      { label: "Discover Makkah — Zamzam water project", url: "https://discovermakkah.sa/en/places-worth-visiting/landmarks/king-abdullah-zamzam-water-project" },
    ],
    position: [23.5, 1.7, -6],
    view: 4.2,
    model: { type: "dispenser", at: [23.5, 0, -6] },
  },
  {
    id: "rehal",
    name: "Qur’an shelves & rehal stand",
    arabic: "الْمَصَاحِف وَالرَّحْل",
    category: "Floor & fixtures",
    tagline: "A million copies within reach of every worshipper",
    built: "Copies printed by the King Fahd Complex for the Printing of the Holy Qur’an, Madinah (opened 1405 AH / 1985)",
    materials: ["Rehal — a folding stand cut from a single piece of wood", "Copper safes, wooden cabinets and open shelves"],
    history: [
      "Copies are kept in cabinets and shelves throughout the mosque. One Saudi report counted 2,200 copper safes, 850 wooden ones and 733 shelves.",
      "For Ramadan 1447 AH (2026) more than a million copies were placed across the Two Holy Mosques, with field teams restocking them.",
      "By 2016 the Madinah complex had printed more than 265 million copies.",
    ],
    timeline: [
      { date: "1985", event: "King Fahd Complex opens in Madinah" },
      { date: "2026", event: "Over a million copies placed for Ramadan 1447 AH" },
    ],
    significance: [{ text: "“The best of you are those who learn the Qur’an and teach it.”", source: "Bukhari" }],
    practice: "Return the copy to its shelf when you finish, and never leave it on the floor.",
    sources: [
      { label: "NST — the world’s largest Qur’an printing plant", url: "https://www.nst.com.my/amp/news/nation/2016/08/162641/visit-worlds-largest-quran-printing-plant" },
      { label: "Siasat — one million copies in the Haram", url: "https://archive.siasat.com/news/one-million-copies-holy-quran-haram-129061" },
      { label: "The Islamic Information — Ramadan 2026 copies", url: "https://theislamicinformation.com/?p=69637" },
    ],
    position: [-23, 1.3, -9],
    view: 3.8,
    model: { type: "rehal", at: [-23, 0, -9] },
  },

  // ───────────── Architecture ─────────────
  {
    id: "ottoman-riwaq",
    name: "Ottoman arcade (riwaq)",
    arabic: "الرِّوَاقُ الْعُثْمَانِي",
    category: "Architecture",
    tagline: "Slender columns and small domes from the 1570s",
    built: "Renovation commissioned by Sultan Selim II from the architect Mimar Sinan in 1570; completed under Murad III",
    materials: ["Stone and marble columns", "Pointed arches", "Rows of small domes"],
    history: [
      "For four centuries the domed Ottoman porticoes framed the mataf — they are the arcades seen in old photographs of the Haram.",
      "Ottoman columns are slender and round and carry pointed arches; the Saudi-era columns behind them are far thicker and clad in polished stone.",
      "The first Saudi expansion removed many Ottoman features, especially support columns. From 2012, during the King Abdullah expansion, the porticoes were taken down piece by piece and restored by the Saudi Binladin Group with the Turkish firm Gürsoy.",
    ],
    timeline: [
      { date: "1570", event: "Selim II commissions Mimar Sinan" },
      { date: "1570s", event: "Completed under Murad III" },
      { date: "1955–73", event: "Many Ottoman features removed in the first Saudi expansion" },
      { date: "2012 onward", event: "Porticoes dismantled for restoration" },
    ],
    sources: [
      { label: "Daily Sabah — Ottoman service to the Holy Lands", url: "https://www.dailysabah.com/feature/2017/11/10/ottomans-centuries-of-great-service-to-the-holy-lands" },
      { label: "Observer BD — history of the Haram", url: "https://www.observerbd.com/news/223293" },
    ],
    position: [0, 2.4, -26.6],
    view: 7,
  },
  {
    id: "ottoman-lamp",
    name: "Hanging lantern",
    arabic: "الْقِنْدِيل",
    category: "Architecture",
    tagline: "Before electricity, the Haram was lit by oil lamps",
    built: "Lanterns like this recall the oil lamps of the Ottoman centuries",
    materials: ["Brass frame", "Glass", "Originally oil and wick — now electric"],
    history: [
      "Lighting the Haram was a gift sultans competed to give. Sultan Ahmed I (r. 1603–1617) is recorded sending two oil lamps adorned with diamonds to hang in the Haram.",
      "Rows of oil lamps also lit the path between Safa and Marwah.",
      "Today the whole mosque is lit electrically; the lantern form survives as decoration in the arcades.",
    ],
    timeline: [{ date: "Early 17th century", event: "Ahmed I sends diamond-set oil lamps" }],
    significance: [{ text: "“Allah is the Light of the heavens and the earth. His light is like a niche in which is a lamp; the lamp is in a glass…”", source: "Qur’an 24:35" }],
    sources: [{ label: "Daily Sabah — Ottoman service to the Holy Lands", url: "https://www.dailysabah.com/feature/2017/11/10/ottomans-centuries-of-great-service-to-the-holy-lands" }],
    position: [-19.4, 3.2, 18.4],
    view: 4,
    model: { type: "lantern", at: [-19.4, 0, 18.4] },
  },
  {
    id: "saudi-expansions",
    name: "Saudi-era columns & minarets",
    arabic: "التَّوْسِعَاتُ السُّعُودِيَّة",
    category: "Architecture",
    tagline: "Three expansions in seventy years",
    built: "1955 to the present",
    materials: ["Marble-clad columns", "Reinforced concrete structure"],
    history: [
      "The first Saudi expansion (1955–1973), begun under King Sa‘ud, added four minarets and new flooring.",
      "King Fahd laid the foundation stone for the next expansion in 1988. It added about 76,000 m² on the western side and two 89-metre minarets.",
      "King Abdullah launched the largest expansion in 2011 — reported at SR80 billion — with a new main gate named after him and two more minarets.",
      "Counts differ as work continues; recent reporting gives the mosque 13 minarets, more than any other mosque.",
    ],
    timeline: [
      { date: "1955–73", event: "First Saudi expansion" },
      { date: "1988", event: "King Fahd’s expansion begins" },
      { date: "2011", event: "King Abdullah’s expansion launched" },
    ],
    significance: [
      { text: "“Do not set out on a journey except to three mosques: al-Masjid al-Haram, the Mosque of the Messenger ﷺ, and al-Masjid al-Aqsa.”", source: "Bukhari, Muslim" },
    ],
    sources: [
      { label: "Arab News — expansions of the Two Holy Harams", url: "https://www.arabnews.com/node/270914" },
      { label: "Arab News — King Abdullah’s SR80bn expansion", url: "https://www.arabnews.com/node/388203" },
      { label: "Arab News — the Grand Mosque", url: "https://www.arabnews.pk/node/1895956/saudi-arabia" },
    ],
    position: [20.9, 5.2, 20.9],
    view: 10,
    model: { type: "saudiPillar", at: [20.9, 0, 20.9] },
  },
];

export type HaramId = (typeof haramHistoricalData)[number]["id"];
