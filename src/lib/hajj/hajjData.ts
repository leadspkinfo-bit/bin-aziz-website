/**
 * Everything the Hajj guide says, in journey order. Hajj al-Tamattu‘, following the Hanafi method
 * commonly taught in Pakistan; `note` entries say where other schools or practical conditions differ.
 * Religious text: change only with care and keep the references. Reviewed by no scholar yet.
 *
 * `status` is the ruling of the act in the Hanafi school: rukn (Hajj is invalid without it), wajib
 * (leaving it needs a dam) or sunnah.
 */

import { niyyah as umrahNiyyah, talbiyah, type Dua } from "@/lib/umrahGuide";

export type Status = "rukn" | "wajib" | "sunnah";

export type HajjStep = {
  id: string;
  title: string;
  arabic?: string;
  summary: string;
  status?: Status;
  /** Ordered actions, as a pilgrim does them */
  steps: string[];
  /** Rules and timings that must not be missed */
  rules?: string[];
  women?: string[];
  /** Common mistakes */
  avoid?: string[];
  /** Where schools or current conditions differ */
  note?: string;
  duas?: { label: string; dua: Dua }[];
  evidence?: { text: string; source: string }[];
  sources?: { label: string; url: string }[];
};

export const hajjNiyyah: Dua = {
  arabic: "اللّٰهُمَّ إِنِّي أُرِيدُ الْحَجَّ فَيَسِّرْهُ لِي وَتَقَبَّلْهُ مِنِّي",
  transliteration: "Allāhumma innī urīdul-ḥajja fa yassirhu lī wa taqabbalhu minnī.",
  meaning: "O Allah, I intend to perform Hajj, so make it easy for me and accept it from me.",
};

export const takbirTashreeq: Dua = {
  arabic: "اللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ، لَا إِلٰهَ إِلَّا اللّٰهُ، وَاللّٰهُ أَكْبَرُ اللّٰهُ أَكْبَرُ، وَلِلّٰهِ الْحَمْدُ",
  transliteration: "Allāhu akbar, Allāhu akbar, lā ilāha illallāh, wallāhu akbar, Allāhu akbar, wa lillāhil-ḥamd.",
  meaning: "Allah is the Greatest, Allah is the Greatest; there is no god but Allah; Allah is the Greatest, Allah is the Greatest, and all praise is for Allah.",
};

const arafahDhikr: Dua = {
  arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
  transliteration: "Lā ilāha illallāhu waḥdahu lā sharīka lah, lahul-mulku wa lahul-ḥamdu wa huwa ‘alā kulli shay’in qadīr.",
  meaning: "There is no god but Allah alone, without partner. His is the dominion, His is the praise, and He has power over all things.",
};

const stoningTakbir: Dua = {
  arabic: "بِسْمِ اللّٰهِ، اللّٰهُ أَكْبَرُ",
  transliteration: "Bismillāh, Allāhu akbar.",
  meaning: "In the name of Allah; Allah is the Greatest. Said with each pebble.",
};

const askimamArafah = { label: "Combining at ‘Arafah (Hanafi answers)", url: "https://islamqa.org/hanafi/albalagh/22144/combining-zuhr-and-asr-at-arafah/" };
const ramiOptions = { label: "SeekersGuidance — options for the stonings", url: "https://seekersguidance.org/answers/hajj/what-are-the-options-available-for-the-stonings-in-hajj/" };

const raw = [
  {
    id: "leaving-home",
    title: "Before you leave home",
    summary: "Hajj begins with settling your affairs. Your documents, Ihram and intention are prepared before you lock the door.",
    steps: [
      "Repent, settle debts and return anything owed; Hajj must be paid for from halal money.",
      "Learn the rites now, with your group’s scholar — there is little time to learn them in Mina.",
      "Pack the documents folder: original passport, Hajj visa, Nusuk card or permit papers, air ticket, hotel vouchers and the Bin Aziz Transport Voucher.",
      "Pack two Ihram sets in the hand-carry (men), unscented soap, comfortable sandals, regular medicines and a small bag for pebbles.",
      "Leave your travel plan and any will with your family, and ask them to forgive you.",
    ],
    rules: ["The Ihram stays in the hand-carry if your flight lands in Jeddah — you enter it for Umrah before the plane crosses the Miqat."],
    evidence: [
      { text: "“Whoever performs Hajj for Allah and does not commit obscenity or transgression returns as on the day his mother bore him.”", source: "Bukhari, Muslim" },
      { text: "“An accepted Hajj has no reward but Paradise.”", source: "Bukhari, Muslim" },
    ],
  },
  {
    id: "home-airport",
    title: "At your home airport",
    summary: "Check-in, immigration, Ihram, the lounge and the gate. Tap a + for the details of each stop.",
    steps: [
      "Reach the airport about three hours early and check in your luggage.",
      "At the immigration counter your passport is checked and stamped.",
      "If you land in Jeddah, put on Ihram in the prayer room and pray two rak‘ahs of nafl outside a disliked time.",
      "Wait in the lounge, then board at your gate.",
    ],
  },
  {
    id: "flight",
    title: "The flight and the Miqat",
    summary: "With Tamattu‘ your first Ihram is for Umrah only — the Hajj Ihram comes on the 8th.",
    steps: [
      "Before the plane crosses the Miqat, make the intention for Umrah and say the Talbiyah.",
      "If you land in Madinah, fly in normal clothes — Ihram comes at Dhul Hulayfah.",
    ],
    rules: ["Crossing the Miqat without Ihram, when going to Makkah, requires a dam unless you go back to a Miqat."],
    duas: [
      { label: "Niyyah for Umrah", dua: umrahNiyyah },
      { label: "Talbiyah", dua: talbiyah },
    ],
  },
  {
    id: "arrival",
    title: "Arrival and the Bin Aziz voucher",
    summary: "Immigration, then the Bin Aziz representative checks your voucher and takes you to your vehicle.",
    steps: [
      "Clear immigration with your passport and Hajj visa; fingerprints are usually taken.",
      "Collect your luggage and keep your documents folder in hand.",
      "Show your Bin Aziz Transport Voucher to our representative and the officials at arrivals.",
      "Board your assigned Bin Aziz vehicle with your group.",
    ],
  },
  {
    id: "transfer-to-makkah",
    title: "Jeddah to your Makkah hotel",
    summary: "Your Bin Aziz vehicle takes you straight to the hotel. You are in Ihram, so keep the Talbiyah going.",
    steps: ["Stay with your group and keep your documents with you.", "Recite the Talbiyah on the road.", "Rest on the way if you can — your Umrah comes next."],
  },
  {
    id: "makkah-hotel",
    title: "Your Makkah hotel",
    arabic: "مَكَّةُ الْمُكَرَّمَة",
    summary: "This is your base until the 8th. You check in, rest and refresh, then walk to the Haram for your Umrah.",
    steps: [
      "Our representative hands over your room keys and briefs the group.",
      "Eat, rest and renew your wudu. If you are in Ihram, its restrictions still apply.",
      "Leave your luggage and go to Masjid al-Haram for your Umrah when you are rested.",
    ],
  },
  {
    id: "madinah",
    title: "Ziyarat of Madinah",
    arabic: "الْمَدِينَةُ الْمُنَوَّرَة",
    summary: "Visiting Masjid an-Nabawi is not part of Hajj and Hajj is complete without it — but it is a great sunnah for those who can.",
    steps: [
      "Enter Masjid an-Nabawi with your right foot and pray two rak‘ahs.",
      "Give salam to the Prophet ﷺ, then to Abu Bakr and ‘Umar (RA), calmly and with a low voice.",
      "Pray in Riyad al-Jannah with a Nusuk permit.",
      "Visit Quba, Uhud and al-Baqi with your group.",
    ],
    note: "A widely quoted narration about praying forty prayers in Masjid an-Nabawi is disputed by hadith scholars — it is not a condition of the visit, so don’t strain yourself or others for it.",
    evidence: [{ text: "“One prayer in this mosque of mine is better than a thousand prayers elsewhere, except al-Masjid al-Haram.”", source: "Bukhari, Muslim" }],
  },
  {
    id: "miqat-dhul-hulayfah",
    title: "Miqat at Dhul Hulayfah",
    arabic: "ذُو الْحُلَيْفَة",
    summary: "Leaving Madinah for Makkah, the Ihram for your Umrah begins at Abyar ‘Ali.",
    steps: ["Take a ghusl, put on Ihram and pray two rak‘ahs of nafl.", "Make the intention for Umrah and begin the Talbiyah before the bus leaves the Miqat."],
    duas: [{ label: "Niyyah for Umrah", dua: umrahNiyyah }],
  },
  {
    id: "first-umrah",
    title: "Your Umrah — the “Tamattu‘”",
    arabic: "عُمْرَةُ التَّمَتُّع",
    summary: "Tawaf, Sa’i and cutting the hair, exactly as in the Umrah guide. Then you leave Ihram until the 8th.",
    steps: [
      "Stop the Talbiyah when Tawaf begins.",
      "Make seven rounds of Tawaf with Idtiba and, for men, Ramal in the first three.",
      "Pray two rak‘ahs behind Maqam-e-Ibrahim and drink Zamzam.",
      "Make seven rounds of Sa’i from Safa, ending at Marwah.",
      "Shave or trim (men), or cut a fingertip’s length (women). You are now out of Ihram.",
    ],
    rules: ["Tamattu‘ means an Umrah and a Hajj with a break between them, both within the months of Hajj and on the same journey."],
    evidence: [{ text: "“Whoever takes advantage of Umrah until Hajj must give what is easy of the sacrifice.”", source: "Qur’an 2:196" }],
  },
  {
    id: "waiting-in-makkah",
    title: "Days in Makkah before Hajj",
    summary: "All Ihram restrictions are lifted. Spend the days in prayer in the Haram and save your strength.",
    steps: ["Pray in the Haram as much as you can, without exhausting yourself before Hajj.", "Make nafl Tawaf — it is the one worship you can only do here.", "Keep your Hajj Ihram clean, and pack a small bag for six days: Ihram, medicines, a mat, and your Nusuk card."],
    avoid: ["Don’t leave on repeated extra Umrahs at the cost of your health — scholars discourage wearing yourself out before the days of Hajj."],
    evidence: [{ text: "“A prayer in al-Masjid al-Haram is better than 100,000 prayers elsewhere.”", source: "Ibn Majah, Ahmad" }],
  },
  {
    id: "ihram-at-hotel",
    title: "8 Dhul Hijjah — Ihram at your hotel",
    arabic: "يَوْمُ التَّرْوِيَة",
    summary: "The Day of Tarwiyah, and Hajj begins here. You put on Ihram in your Makkah hotel room and intend Hajj.",
    steps: [
      "Clip your nails, remove unwanted hair and take a ghusl.",
      "Men put on the two white sheets; women wear their usual modest clothes.",
      "Pray two rak‘ahs of nafl, outside a disliked time.",
      "Make the intention for Hajj and begin the Talbiyah. From now on every Ihram restriction applies again.",
    ],
    rules: ["Your Ihram for Hajj is put on from where you are staying in Makkah — you do not go to a Miqat."],
    duas: [
      { label: "Niyyah for Hajj", dua: hajjNiyyah },
      { label: "Talbiyah", dua: talbiyah },
    ],
  },
  {
    id: "road-to-mina",
    title: "From your hotel to Mina",
    summary: "With your bag packed for six days, you leave the hotel with your group for the tents of Mina.",
    steps: [
      "Carry only your small bag: Ihram, medicines, a mat, your Nusuk card and your documents folder.",
      "Board your group’s Bin Aziz bus, or walk with your group if that is the plan.",
      "Keep reciting the Talbiyah all the way.",
      "Stay with your group and note your camp number and tent as soon as you reach Mina.",
    ],
    note: "Because of the crowds, groups often move pilgrims to Mina the night before, on the 7th. Follow your group’s timing; if so, you put on Ihram before leaving the hotel.",
  },
  {
    id: "day-8-mina",
    title: "8 Dhul Hijjah — The tents of Mina",
    arabic: "مِنًى",
    summary: "You settle into the tent city and spend the day and night in worship.",
    status: "sunnah",
    steps: [
      "Pray five prayers in Mina: Zuhr, Asr, Maghrib and Isha of the 8th, and Fajr of the 9th.",
      "Spend the night in Mina in dhikr, Qur’an and du‘a — and in sleep, for tomorrow is the greatest day.",
    ],
    rules: ["Staying in Mina on this night is sunnah; missing it does not need a dam, but don’t leave it without a reason."],
    note: "Whether you shorten your prayers in Mina and Arafat depends on how long you have been in Makkah. Hanafi scholars today differ on it, so follow your group’s scholar.",
    evidence: [{ text: "On the Day of Tarwiyah they set out for Mina, and the Prophet ﷺ prayed Zuhr, Asr, Maghrib, Isha and Fajr there.", source: "Sahih Muslim, hadith of Jabir" }],
  },
  {
    id: "day-9-arafat",
    title: "9 Dhul Hijjah — the Standing at Arafat",
    arabic: "الْوُقُوفُ بِعَرَفَة",
    summary: "The heart of Hajj. Whoever is within the boundaries of Arafat, even for a moment, between noon on the 9th and dawn on the 10th has caught the Hajj.",
    status: "rukn",
    steps: [
      "Pray Fajr in Mina. From this Fajr the Takbir of Tashreeq is said after every fard prayer.",
      "Travel to Arafat after sunrise and check that you are inside its boundaries — your group’s camp will be.",
      "After noon, listen to the khutbah if you can and pray Zuhr and Asr (see the ruling below).",
      "Spend the afternoon standing, facing the Qibla with raised hands, in du‘a, dhikr, Talbiyah and tears. Sit when you tire.",
      "Stay until the sun has fully set. Then leave for Muzdalifah calmly — without praying Maghrib at Arafat.",
    ],
    rules: [
      "Wuquf is valid anywhere within Arafat except the valley of ‘Uranah. Signs mark the boundary.",
      "Leaving Arafat before sunset needs a dam, unless you return before sunset.",
      "In the Hanafi school Zuhr and Asr are joined only behind the Imam of Hajj at Masjid Namirah. In your tent, pray each in its own time, in congregation.",
      "Wudu is not a condition of Wuquf, so a woman on her period stands at Arafat like everyone else.",
    ],
    avoid: ["Don’t climb Jabal al-Rahmah in the heat or push through crowds for it — standing on it has no special ruling.", "Don’t spend these hours on your phone or asleep; they are the reason you came.", "Pilgrims should not fast on this day; the Prophet ﷺ did not."],
    note: "Other schools let everyone at Arafat join Zuhr and Asr, and many groups do. A Hanafi follows the ruling above; a group following another school’s scholar may join them.",
    duas: [
      { label: "Best dhikr of the Day of Arafah", dua: arafahDhikr },
      { label: "Takbir of Tashreeq — after every fard prayer, Fajr of the 9th to Asr of the 13th", dua: takbirTashreeq },
    ],
    evidence: [
      { text: "“Hajj is Arafah.”", source: "Tirmidhi, Nasa’i, Ibn Majah" },
      { text: "“There is no day on which Allah frees more servants from the Fire than the Day of Arafah.”", source: "Sahih Muslim" },
      { text: "“The best du‘a is the du‘a of the Day of Arafah.”", source: "Tirmidhi" },
      { text: "“I stood here, and all of Arafah is a place of standing.”", source: "Sahih Muslim" },
    ],
    sources: [
      askimamArafah,
      { label: "Darul Iftaa Birmingham — combining at ‘Arafah", url: "https://daruliftabirmingham.co.uk/home/?p=16642" },
      { label: "SeekersGuidance — the takbirs of ‘Id", url: "https://seekersguidance.org/answers/hanafi-fiqh/the-day-of-arafah-the-9th-of-dhul-hijjah-and-the-takbirs-of-eid/" },
    ],
  },
  {
    id: "day-9-muzdalifah",
    title: "Night of the 10th — Muzdalifah",
    arabic: "الْمُزْدَلِفَة",
    summary: "Under the open sky. You join Maghrib and Isha here, gather pebbles, sleep, and stand in du‘a after Fajr.",
    status: "wajib",
    steps: [
      "Keep the Talbiyah on your tongue on the road from Arafat.",
      "At Muzdalifah, pray Maghrib and Isha together in the time of Isha, with one adhan and one iqamah.",
      "Pick up your pebbles here if you wish, each about the size of a chickpea.",
      "Sleep — this is a sunnah — then pray Fajr early in its time.",
      "Stand facing the Qibla in du‘a from Fajr until shortly before sunrise. This is the wajib standing.",
      "Leave for Mina before the sun rises.",
    ],
    rules: [
      "Joining the two prayers here is required for every pilgrim in the Hanafi school. Don’t pray Maghrib on the way; if the road delays you, pray before Fajr comes in.",
      "The standing is wajib between dawn and sunrise on the 10th; leaving it without an excuse needs a dam.",
      "Pebbles may be picked up anywhere except the spot of the Jamarat itself; they need not come from Muzdalifah. Wash them if you wish.",
    ],
    women: ["Women, the elderly, the weak and the sick may leave for Mina during the night without penalty, as the Prophet ﷺ permitted."],
    avoid: ["Don’t break pebbles from rock or take stones as big as a fist — small ones are the sunnah."],
    evidence: [
      { text: "“Then when you pour forth from Arafat, remember Allah at al-Mash‘ar al-Haram.”", source: "Qur’an 2:198" },
      { text: "“I stood here, and all of Muzdalifah is a place of standing.”", source: "Sahih Muslim" },
    ],
    sources: [{ label: "Darul Iftaa Birmingham — leaving Muzdalifah early", url: "https://daruliftabirmingham.co.uk/home/earliest-permissible-time-for-the-weak-ill-disabled-women-to-depart-from-muzdalifah" }],
  },
  {
    id: "day-10-rami",
    title: "10 Dhul Hijjah — Stoning Jamarat al-Aqabah",
    arabic: "جَمْرَةُ الْعَقَبَة",
    summary: "Eid day. The first act back in Mina: seven pebbles at the largest Jamrah only.",
    status: "wajib",
    steps: [
      "Travel to the Jamarat complex and find Jamarat al-Aqabah, the largest pillar, closest to Makkah.",
      "Stop the Talbiyah as you throw your first pebble. You will not say it again.",
      "Throw seven pebbles one at a time, saying the takbir with each.",
      "Leave without stopping for du‘a at this Jamrah.",
    ],
    rules: [
      "The sunnah time is from sunrise to noon; it remains allowed until sunset, and from sunset to dawn it is disliked without an excuse.",
      "Every pebble must land in the basin. A pebble that misses is thrown again.",
      "Only this one Jamrah is stoned today.",
    ],
    women: ["Women, the elderly and the weak have an excuse for the crowds and may stone at night."],
    avoid: ["Don’t throw shoes, large stones or anger — the act is worship, not rage.", "Don’t push. Harming a Muslim is a greater sin than a delayed pebble."],
    note: "Someone truly unable to reach the Jamarat — ill or disabled — may appoint a proxy, who stones for himself first. Being tired or afraid of a crowd is not such an excuse; ask your scholar.",
    duas: [{ label: "With each pebble", dua: stoningTakbir }],
    evidence: [{ text: "The Prophet ﷺ continued the Talbiyah until he stoned Jamarat al-Aqabah.", source: "Bukhari, Muslim" }],
    sources: [ramiOptions, { label: "Darul Iftaa Birmingham — stoning by proxy", url: "https://daruliftabirmingham.co.uk/?p=18580" }],
  },
  {
    id: "day-10-qurbani",
    title: "10 Dhul Hijjah — The Qurbani",
    arabic: "الْهَدْي",
    summary: "After stoning and before shaving. A Tamattu‘ pilgrim owes this sacrifice in thanks for joining Umrah and Hajj in one journey, and it follows the sunnah of Ibrahim (AS).",
    status: "wajib",
    steps: [
      "After stoning, make sure your sacrifice is done: by yourself, your group, or the official Adahi voucher.",
      "A sheep or goat, or a one-seventh share of a cow or camel, is enough.",
      "Wait to hear that it has been done before you shave.",
    ],
    rules: [
      "It must be slaughtered within the Haram boundary, in the days of sacrifice: the 10th, 11th or 12th (before sunset of the 12th in the Hanafi school).",
      "If you cannot afford it, fast ten days: three during Hajj, before the 10th, and seven after returning.",
      "This is separate from the Eid sacrifice you may owe at home.",
    ],
    avoid: ["With a bank voucher you often can’t know the time of slaughter. Because order matters in the Hanafi school, confirm the time first, or ask your group’s scholar how to arrange it."],
    note: "Most pilgrims do not slaughter by hand any more. The Adahi project, run by the Islamic Development Bank since 1983, sells vouchers and carries out the sacrifice on the buyer’s behalf.",
    evidence: [
      { text: "“…must give what is easy of the sacrifice. Whoever cannot find one must fast three days during Hajj and seven when you return.”", source: "Qur’an 2:196" },
      { text: "“And We ransomed him with a great sacrifice.”", source: "Qur’an 37:107" },
      { text: "“Neither their meat nor their blood reaches Allah; it is your piety that reaches Him.”", source: "Qur’an 22:37" },
    ],
    sources: [
      { label: "Adahi — about the project", url: "https://adahi.org/en/Pages/about-adahi.aspx" },
      { label: "Saudipedia — Project for Utilization of Hady and Adahi", url: "https://saudipedia.com/en/saudi-arabia-project-for-utilization-of-hady-and-adahi" },
      { label: "Fatwa-TT — questions on Hajj Qurbani", url: "https://islamqa.org/hanafi/fatwa-tt/134330/few-questions-on-hajj-qurbani/" },
    ],
  },
  {
    id: "day-10-halq",
    title: "10 Dhul Hijjah — Halq or Taqsir",
    arabic: "الْحَلْق وَالتَّقْصِير",
    summary: "Only after the stoning and the sacrifice. Most restrictions of Ihram end here.",
    status: "wajib",
    steps: [
      "Men shave the whole head (best), or trim at least a fingertip’s length from all over.",
      "Women cut only a fingertip’s length from the ends of the hair.",
      "Take off the Ihram and put on normal clothes. Everything is now allowed except marital relations.",
    ],
    rules: [
      "For a Tamattu‘ pilgrim in the Hanafi school the order is wajib: stoning, then sacrifice, then shaving. Breaking it needs a dam.",
      "Halq should be done within the Haram boundary and in the days of sacrifice.",
    ],
    note: "Other schools do not require a dam if this order is changed by mistake, and many pilgrims rely on that. A Hanafi should keep the order or ask a scholar.",
    evidence: [{ text: "The Prophet ﷺ prayed three times for those who shaved, and once for those who trimmed.", source: "Bukhari, Muslim" }],
  },
  {
    id: "day-10-ziyarah",
    title: "Tawaf al-Ziyarah and Sa’i",
    arabic: "طَوَافُ الزِّيَارَة",
    summary: "The second pillar of Hajj. You go to the Kaaba, make Tawaf and Sa’i, and every restriction ends.",
    status: "rukn",
    steps: [
      "Go to Masjid al-Haram, ideally on the 10th after shaving.",
      "Make seven rounds of Tawaf. There is no Idtiba in normal clothes; men do Ramal in the first three rounds if Sa’i follows.",
      "Pray two rak‘ahs and drink Zamzam.",
      "Make the seven rounds of Sa’i for Hajj from Safa to Marwah. This Sa’i is wajib.",
      "Now even marital relations are allowed. Your Hajj’s pillars are complete. Return to Mina for the night.",
    ],
    rules: ["Do it by sunset of the 12th in the Hanafi school. It stays due after that, and delaying it without an excuse needs a dam.", "Hajj is incomplete without this Tawaf; no dam or proxy can replace it for someone able to do it."],
    women: ["A woman on her period does not make Tawaf. She waits until she is pure and then makes it, and has no penalty for the delay. If her flight cannot wait, she should ask a scholar before leaving Makkah."],
    evidence: [{ text: "“…and let them circle the Ancient House.”", source: "Qur’an 22:29" }],
    sources: [{ label: "Darul Iftaa Birmingham — delaying Tawaf al-Ziyarah", url: "https://islamqa.org/hanafi/daruliftaa-birmingham/136596/ruling-for-missing-tawaf-ziyarah-due-to-menses/" }],
  },
  {
    id: "day-11-tashreeq",
    title: "11 Dhul Hijjah — Stoning all three",
    arabic: "أَيَّامُ التَّشْرِيق",
    summary: "First of the Days of Tashreeq. Back in Mina, you stone the three Jamarat, in order, after noon.",
    status: "wajib",
    steps: [
      "Spend the night in Mina.",
      "After noon, go to the small Jamrah (al-Ula), nearest the Masjid al-Khayf. Throw seven pebbles.",
      "Step aside, face the Qibla and make a long du‘a.",
      "Go to the middle Jamrah (al-Wusta). Throw seven pebbles, then step aside and make du‘a.",
      "Go to Jamarat al-Aqabah. Throw seven pebbles and leave without du‘a.",
    ],
    rules: [
      "The time begins after noon; stoning before noon on the 11th and 12th is not valid in the main Hanafi position.",
      "The sunnah time is until sunset; from sunset to dawn it is disliked without an excuse. Women and the weak have that excuse.",
      "Keep the order: small, middle, large. That makes 21 pebbles.",
      "Spending the nights of Tashreeq in Mina is sunnah in the Hanafi school.",
    ],
    note: "Other schools treat the nights in Mina as wajib, and some modern scholars allow stoning before noon for crowd safety. Ask your scholar before relying on either.",
    duas: [{ label: "With each pebble", dua: stoningTakbir }],
    evidence: [{ text: "Ibn ‘Umar (RA) stoned the first two Jamarat, then stood facing the Qibla in long du‘a, and did not stand at the last — and said he saw the Prophet ﷺ do so.", source: "Bukhari" }],
    sources: [ramiOptions, { label: "AskImam — stoning before noon", url: "https://islamqa.org/hanafi/askimam/5431/we-pelted-the-jamaraat-before-dhuhr-on-the-12th-of-dhul-hijjah-was-that-a-permissible-time/" }],
  },
  {
    id: "day-12-tashreeq",
    title: "12 Dhul Hijjah — Stoning, and a choice",
    summary: "The same three Jamarat after noon. After this you may leave Mina, or stay for the 13th.",
    status: "wajib",
    steps: ["Stone the three Jamarat after noon in the same order, with the same du‘a after the first two.", "Decide with your group: leave Mina, or stay one more day.", "If you are leaving, go before sunset."],
    rules: [
      "This is also the last day for the Qurbani, and for Tawaf al-Ziyarah without penalty.",
      "Leaving after sunset on the 12th is disliked, though no dam is due if you leave before dawn of the 13th.",
      "If you are still in Mina at dawn of the 13th, stoning on the 13th becomes wajib.",
    ],
    evidence: [{ text: "“Whoever hurries on in two days, there is no sin on him; and whoever stays on, there is no sin on him — for the one who fears Allah.”", source: "Qur’an 2:203" }],
    sources: [{ label: "Darul Iftaa Chicago — leaving Mina", url: "https://islamqa.org/hanafi/darul-iftaa-chicago/271189/leaving-mina-on-the-13th-of-dhul-hijjah-stoning-before-zawal/" }],
  },
  {
    id: "day-13-tashreeq",
    title: "13 Dhul Hijjah — The last stoning",
    summary: "For those who stay: the three Jamarat one last time. The takbirs end after Asr.",
    status: "sunnah",
    steps: ["Stone the three Jamarat in the same order. This is the sunnah of the Prophet ﷺ, who stayed.", "Return to Makkah.", "After Asr, say the Takbir of Tashreeq for the last time."],
    rules: ["The Hanafi school allows the stoning of this one day before noon, from dawn, though after noon is the sunnah. It ends at sunset.", "Total pebbles with this day: 70. Without it: 49."],
  },
  {
    id: "tawaf-wida",
    title: "Tawaf al-Wida — the farewell",
    arabic: "طَوَافُ الْوَدَاع",
    summary: "Your last act in Makkah. Seven rounds, and then you go.",
    status: "wajib",
    steps: ["Make seven rounds of Tawaf, in normal clothes, without Ramal or Sa’i.", "Pray two rak‘ahs, drink Zamzam, and make du‘a at the Multazam if it is free.", "Leave for Madinah or the airport."],
    rules: ["It is wajib for pilgrims from outside the Miqat, and leaving without it needs a dam, unless you return to do it.", "If you make nafl Tawaf after Tawaf al-Ziyarah, the Tawaf done nearest your departure can stand as your farewell, though intending it is better."],
    women: ["A woman on her period when she leaves is excused from this Tawaf, with no dam, provided she has made Tawaf al-Ziyarah."],
    evidence: [{ text: "The people were ordered to make the House their last act, except that it was lightened for women in menstruation.", source: "Bukhari, Muslim" }],
    sources: [{ label: "SeekersGuidance — farewell Tawaf and menstruation", url: "https://seekersguidance.org/answers/hanafi-fiqh/missing-the-farewell-tawaf-due-to-menstruation/" }],
  },
  {
    id: "departure",
    title: "Home, a new beginning",
    summary: "Your Bin Aziz vehicle takes you to the airport. The test of Hajj is who you are when you get home.",
    steps: ["Board your Bin Aziz vehicle with your documents folder and Zamzam as allowed by your airline.", "Clear immigration and board your flight.", "Pray two rak‘ahs in your local masjid when you reach home.", "Keep your prayers, your character and your du‘as — that is the sign of an accepted Hajj."],
  },
] satisfies HajjStep[];

export type HajjStepId = (typeof raw)[number]["id"];

/** The whole Hajj guide, chronological, one entry per step of the journey. */
export const hajjGuideData: (HajjStep & { id: HajjStepId })[] = raw;

export const hajjStep = (id: HajjStepId) => hajjGuideData.find((s) => s.id === id)!;

/** A one-glance list of what Hajj rests on, in the Hanafi school. */
export const hajjPillars = {
  rukn: ["Standing at Arafat", "Tawaf al-Ziyarah"],
  wajib: ["Standing at Muzdalifah", "Sa’i", "Stoning the Jamarat", "Qurbani (Tamattu‘ and Qiran)", "Halq or Taqsir", "Tawaf al-Wida"],
};
