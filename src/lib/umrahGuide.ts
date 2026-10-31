/**
 * Content for the /umrah-guide scrollytelling page.
 * Follows the method commonly taught in Pakistan (Hanafi); where schools differ, the note says so.
 * Kept here, not in the components, so the wording can be corrected without touching the animation code.
 */

export type Dua = { arabic: string; transliteration: string; meaning: string };

export const phases = [
  { id: "miqat", step: "01", label: "Miqat" },
  { id: "transport", step: "02", label: "Transfer" },
  { id: "hotel", step: "03", label: "Hotel" },
  { id: "tawaf", step: "04", label: "Tawaf" },
  { id: "sai", step: "05", label: "Sa’i" },
  { id: "halq", step: "06", label: "Halq" },
] as const;

export const talbiyah: Dua = {
  arabic: "لَبَّيْكَ اللّٰهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ",
  transliteration:
    "Labbayk Allāhumma labbayk, labbayka lā sharīka laka labbayk, innal-ḥamda wan-ni‘mata laka wal-mulk, lā sharīka lak.",
  meaning:
    "Here I am, O Allah, here I am. Here I am, You have no partner, here I am. All praise, all blessings and all sovereignty belong to You. You have no partner.",
};

export const niyyah: Dua = {
  arabic: "اللّٰهُمَّ إِنِّي أُرِيدُ الْعُمْرَةَ فَيَسِّرْهَا لِي وَتَقَبَّلْهَا مِنِّي",
  transliteration: "Allāhumma innī urīdul-‘umrata fa yassirhā lī wa taqabbalhā minnī.",
  meaning: "O Allah, I intend to perform Umrah, so make it easy for me and accept it from me.",
};

export const miqat = {
  preparation: [
    "Clip nails, remove unwanted hair and take a full bath (ghusl) at home or at the airport.",
    "Men put on the two unstitched white sheets — the izar around the waist and the rida over the shoulders — and footwear that leaves the top of the foot and the ankle bone open.",
    "Women wear their usual modest clothing in any plain colour; the face and hands stay uncovered.",
    "If it is not a disliked time, pray two rak‘ahs of nafl with the intention of Ihram, then board in your Ihram clothes.",
  ],
  restrictions: [
    "No perfume or scented soap",
    "No cutting hair or nails",
    "No marital relations",
    "No hunting or harming animals",
    "Men: no stitched clothes, nothing covering the head",
    "Women: no niqab or gloves touching the face and hands",
  ],
  note: "Flights from Pakistan to Jeddah cross the Miqat (Yalamlam / Qarn al-Manazil) roughly 30–45 minutes before landing, and the crew usually announces it. Ihram cannot be put off until Jeddah. If you fly to Madinah first, you put on Ihram later, before leaving Madinah for Makkah.",
};

export const transport = {
  steps: [
    { title: "Touchdown in Jeddah", text: "The flight lands at King Abdulaziz International Airport. You are in Ihram now — keep the Talbiyah on your tongue." },
    { title: "Immigration & baggage", text: "Passport, Umrah visa and fingerprints at immigration, then collect your luggage. Keep your documents in one pouch." },
    { title: "Met by Bin Aziz", text: "Our representative waits in the arrivals hall with a Bin Aziz sign, counts the group and takes care of your bags." },
    { title: "Board Bin Aziz Transport", text: "An air-conditioned Bin Aziz vehicle takes the whole group together — luggage loaded for you." },
    { title: "Jeddah → Makkah", text: "About 90 km on the Makkah highway — roughly 1 to 1½ hours, straight to your hotel door." },
  ],
  note: "Landing in Madinah instead? Our transport runs Madinah → Makkah too, and stops at the Miqat of Dhul Hulayfah (Abyar ‘Ali) so you can enter Ihram on the way.",
};

export const hotel = {
  steps: [
    { title: "Arrive at the hotel", text: "Bin Aziz Transport drops you at the door — keep reciting the Talbiyah until you begin Tawaf." },
    { title: "Check in", text: "Our representative receives you at the hotel, hands over your keys and Nusuk permits, and briefs the group." },
    { title: "Rest & refresh", text: "Eat, rest and renew your wudu. Tawaf needs a clear mind and a body that is not exhausted — there is no rush." },
    { title: "Leave your luggage", text: "Take only what you need: your room key, phone, a small bag for your sandals and a bottle of water." },
    { title: "Walk to the Haram — still in Ihram", text: "Every Ihram restriction still applies until the very last step of Umrah." },
  ],
  entry: {
    arabic: "بِسْمِ اللّٰهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَىٰ رَسُولِ اللّٰهِ، اللّٰهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Bismillāh, waṣ-ṣalātu was-salāmu ‘alā rasūlillāh. Allāhummaftaḥ lī abwāba raḥmatik.",
    meaning: "In the name of Allah, and peace and blessings upon the Messenger of Allah. O Allah, open for me the doors of Your mercy.",
  } satisfies Dua,
};

export const tawaf = {
  rules: [
    { title: "Wudu is required", text: "Tawaf is performed in a state of purity. If your wudu breaks, step out, renew it and continue from the round you were on." },
    { title: "Idtiba — men", text: "Before starting, pass the upper sheet under the right arm and over the left shoulder, leaving the right shoulder bare for all seven rounds." },
    { title: "Ramal — men", text: "In the first three rounds walk briskly with short steps and shoulders moving, if the crowd allows. Walk normally in rounds four to seven." },
    { title: "Kaaba on your left", text: "Circle anticlockwise, outside the Hateem, without turning your chest or back towards the Kaaba." },
  ],
  steps: [
    "Stop the Talbiyah as Tawaf begins. Stand in line with the Black Stone and make the intention for Tawaf.",
    "Face the Black Stone, raise your hands to your ears and say “Bismillāhi Allāhu akbar”. Kiss it if you can reach it without pushing anyone; otherwise point your palms towards it and kiss them.",
    "Walk with the Kaaba on your left. Dhikr, du‘a and Qur’an in any language are all fine — no fixed du‘a is required for each round.",
    "At the Rukn Yamani (the corner before the Black Stone), touch it with your right hand if possible. Do not point at it from a distance.",
    "Between the Rukn Yamani and the Black Stone, recite the du‘a below. Each return to the Black Stone completes one round.",
    "After the seventh round, cover your right shoulder again.",
    "Pray two rak‘ahs behind Maqam-e-Ibrahim — anywhere in the Haram if it is crowded — reciting Surah al-Kafirun and Surah al-Ikhlas, outside the disliked times.",
    "Drink Zamzam standing, facing the Kaaba, and make du‘a — then head to Safa.",
  ],
  rabbana: {
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbanā ātinā fid-dunyā ḥasanatan wa fil-ākhirati ḥasanatan wa qinā ‘adhāban-nār.",
    meaning: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire. (2:201)",
  } satisfies Dua,
  zamzam: {
    arabic: "اللّٰهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا وَاسِعًا، وَشِفَاءً مِنْ كُلِّ دَاءٍ",
    transliteration: "Allāhumma innī as’aluka ‘ilman nāfi‘an, wa rizqan wāsi‘an, wa shifā’an min kulli dā’.",
    meaning: "O Allah, I ask You for beneficial knowledge, abundant provision and a cure for every illness.",
  } satisfies Dua,
  zamzamVirtue: { text: "The water of Zamzam is for whatever it is drunk for.", source: "Ibn Majah" },
};

export const sai = {
  steps: [
    { title: "Begin at Safa", text: "Climb Safa a little. At the start of the first round only, recite the verse below." },
    { title: "Face the Kaaba", text: "Raise your hands as in du‘a (not as in salah), say Allāhu akbar three times and recite the dhikr below three times, making your own du‘a in between." },
    { title: "Walk to Marwah", text: "Walk at a normal pace. Between the two green lights, men jog moderately; women keep walking." },
    { title: "On Marwah", text: "Face the Kaaba and repeat the same dhikr and du‘a. Safa → Marwah is one round." },
    { title: "Seven rounds", text: "Marwah → Safa is the second round, and so on. The seventh round ends at Marwah — about 3.2 km in total." },
  ],
  verse: {
    arabic: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللّٰهِ ۖ أَبْدَأُ بِمَا بَدَأَ اللّٰهُ بِهِ",
    transliteration: "Innaṣ-ṣafā wal-marwata min sha‘ā’irillāh. Abda’u bimā bada’allāhu bih.",
    meaning: "Indeed Safa and Marwah are among the symbols of Allah (2:158). I begin with what Allah began with.",
  } satisfies Dua,
  hills: {
    arabic:
      "لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ، أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الْأَحْزَابَ وَحْدَهُ",
    transliteration:
      "Lā ilāha illallāhu waḥdahu lā sharīka lah, lahul-mulku wa lahul-ḥamdu wa huwa ‘alā kulli shay’in qadīr. Lā ilāha illallāhu waḥdah, anjaza wa‘dah, wa naṣara ‘abdah, wa hazamal-aḥzāba waḥdah.",
    meaning:
      "None has the right to be worshipped but Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things. None has the right to be worshipped but Allah alone; He fulfilled His promise, gave victory to His servant and defeated the confederates alone. (Sahih Muslim)",
  } satisfies Dua,
  greenLights: {
    arabic: "رَبِّ اغْفِرْ وَارْحَمْ، إِنَّكَ أَنْتَ الْأَعَزُّ الْأَكْرَمُ",
    transliteration: "Rabbighfir warḥam, innaka antal-a‘azzul-akram.",
    meaning: "My Lord, forgive and have mercy. You are the Most Mighty, the Most Generous. (reported from Ibn Mas‘ud and Ibn ‘Umar, RA)",
  } satisfies Dua,
};

export const halq = {
  men: {
    title: "For men",
    points: [
      "Halq — shaving the whole head — is strongly recommended. The Prophet ﷺ prayed three times for those who shaved, and once for those who trimmed (Bukhari, Muslim).",
      "Taqsir — trimming — is also valid: cut at least a fingertip’s length (about an inch) evenly from all over the head. A trim of only a few strands is not enough.",
      "A clipper with no guard counts as Halq.",
    ],
  },
  women: {
    title: "For women",
    points: [
      "Women must never shave their heads.",
      "Gather the hair (or the end of the braid) and cut only a fingertip’s length — about an inch — from the ends.",
      "It can be done privately in the hotel room, by herself, her mahram or another woman.",
    ],
  },
  notes: [
    "Done after Sa’i, inside the boundaries of the Haram.",
    "You may cut someone else’s hair only once you have finished your own Sa’i.",
  ],
  complete: "With this step your Umrah is complete. Every Ihram restriction is lifted — change into your normal clothes, and thank Allah ﷻ for accepting you as His guest.",
  closing: "تَقَبَّلَ اللّٰهُ مِنَّا وَمِنْكُمْ",
};
