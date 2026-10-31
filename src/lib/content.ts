// Copy taken from the Bin Aziz company profile.

export type IconName =
  | "kaaba"
  | "plane"
  | "passport"
  | "globe"
  | "compass"
  | "shield"
  | "heart"
  | "whatsapp"
  | "clock"
  | "users"
  | "badge";

export type Service = {
  slug: string;
  title: string;
  icon: IconName;
  short: string;
  intro: string;
  features: string[];
  steps: string[];
};

export const services: Service[] = [
  {
    slug: "umrah",
    title: "Umrah Packages",
    icon: "kaaba",
    short: "Complete Umrah journeys with visa, flights, hotels near the Haram and guided ziyarat.",
    intro:
      "Every Umrah journey we arrange is built around ease, peace of mind and barakah — so you can focus entirely on your ibadah while we take care of everything else.",
    features: [
      "Umrah visa processing",
      "Return flights from Lahore and other cities",
      "Hotels near Masjid al-Haram and Masjid an-Nabawi",
      "Private and group transport (Hiace, Staria, sedans)",
      "Guided ziyarat in Makkah and Madinah",
      "Corporate and family Umrah delegations",
      "24/7 WhatsApp support during your journey",
    ],
    steps: ["Share your dates and group size", "Choose your package and hotels", "We process the visa and tickets", "Travel with our team’s support"],
  },
  {
    slug: "ticketing",
    title: "Worldwide Ticketing",
    icon: "plane",
    short: "Domestic and international air tickets on all major airlines at competitive fares.",
    intro:
      "As an IATA licensed agency we issue tickets directly on leading domestic and international airlines, with honest fares and real-time updates on your booking.",
    features: [
      "Domestic and international flights",
      "One-way, return and multi-city itineraries",
      "Group and corporate bookings",
      "Date changes, re-issues and refunds handled for you",
      "Real-time fare and schedule updates",
    ],
    steps: ["Tell us your route and dates", "Get the best available fares", "Confirm and receive your e-ticket", "We assist with any changes"],
  },
  {
    slug: "visit-visa",
    title: "Visit Visa",
    icon: "passport",
    short: "Guided visit and tourist visa applications with complete documentation support.",
    intro:
      "Our consultants guide you through every requirement of your visit visa — from document checklists to application submission — with transparency at each step.",
    features: [
      "Tourist and family visit visas",
      "Document checklist and file preparation",
      "Application submission and tracking",
      "Travel insurance and hotel bookings",
      "Honest guidance on eligibility",
    ],
    steps: ["Free eligibility consultation", "Document preparation", "Application submission", "Visa decision and travel planning"],
  },
  {
    slug: "religious-travel",
    title: "Religious Travel",
    icon: "compass",
    short: "Faith-centred tours with Halal-friendly stays and Islamic conduct throughout.",
    intro:
      "Our religious travel is curated around Islamic principles — Halal-friendly accommodation, prayer-friendly schedules and staff trained in Islamic etiquette.",
    features: [
      "Ziyarat tours",
      "Halal-friendly accommodation",
      "Prayer-friendly itineraries",
      "Staff trained in Islamic adab",
    ],
    steps: ["Share your intention", "We design the itinerary", "Bookings and documents", "A peaceful journey"],
  },
];

export const achievements = [
  { value: 10000, suffix: "+", label: "Umrah pilgrims served" },
  { value: 100, suffix: "%", label: "Client satisfaction" },
  { value: 24, suffix: "/7", label: "WhatsApp support" },
] as const;

export const highlights: { icon: IconName; title: string; text: string }[] = [
  { icon: "badge", title: "IATA Licensed", text: "Tickets issued directly on leading airlines." },
  { icon: "users", title: "Corporate Delegations", text: "Group and corporate Umrah, handled end to end." },
  { icon: "clock", title: "Real-time Updates", text: "Know the status of your booking at every step." },
  { icon: "whatsapp", title: "WhatsApp Support", text: "Our team is a message away during your journey." },
];

export const values = [
  { word: "Khidmat", meaning: "Service", arabic: "خدمت" },
  { word: "Amanah", meaning: "Trust", arabic: "أمانة" },
  { word: "Ikhlaas", meaning: "Sincerity", arabic: "إخلاص" },
] as const;

export const shariahPolicies = [
  "All travel arrangements, partnerships and services are aligned with Islamic principles and Shariah guidelines.",
  "Transparent and interest-free (Riba-free) financial practices in all transactions.",
  "Umrah and visa services curated to ensure Halal-friendly accommodation and Islamic conduct throughout the journey.",
  "Committed to honesty, trust (Amanah) and justice (ʿAdl) in all our client dealings.",
];

export const staffEthics = [
  "Regular training on Islamic etiquette (Adab) and client interaction based on the Sunnah.",
  "Each staff member is nurtured to uphold Ikhlas (sincerity), Amanah (trustworthiness) and Akhlaq (good character).",
  "Modesty, respect and humility in all communication and client services.",
  "Not only a company, but a mission of service rooted in Islamic values.",
];

export const leaders = [
  {
    role: "Chairman",
    photo: "/images/team/chairman-hd.webp",
    name: null,
    quote:
      "Serving the guests of Allah ﷻ is a responsibility and a blessing. Our journey is not just about logistics — it’s about love, faith, and responsibility. May Bin Aziz always remain a name associated with trust and sincerity in the hearts of pilgrims.",
  },
  {
    role: "Chief Executive Officer",
    photo: "/images/team/ceo-hd.webp",
    name: "Hafiz M. Nouman Aziz",
    quote:
      "We aim to build a brand that becomes synonymous with safe, spiritual, and simplified religious travel. Every service we offer is backed with professional care and deep Islamic ethics.",
  },
  {
    role: "Managing Director",
    photo: "/images/team/managing-director-hd.webp",
    name: null,
    quote:
      "Bin Aziz Tourism is where professionalism meets spirituality. Our systems, automation, and staff training are built around one goal: making your journey as peaceful as your intention.",
  },
  {
    role: "Chief Operating Officer",
    photo: "/images/team/coo-hd.webp",
    name: null,
    quote:
      "Behind every smooth journey are a hundred small details done right — visas filed on time, flights confirmed, hotels near the Haram checked and drivers waiting at arrivals. Our operations team treats each of them as an amanah, so our guests can give their whole heart to their ibadah.",
  },
  {
    role: "General Manager",
    photo: "/images/team/gm-hd.webp",
    name: null,
    quote:
      "Whether a guest walks into our Lahore office or messages us on WhatsApp late at night, they deserve the same honest answer and the same warm care. My role is to make sure our team keeps that promise every day — with khidmat, transparency and respect.",
  },
  {
    role: "Director Logistics & Operations",
    photo: "/images/team/director-hd.webp",
    name: null,
    quote:
      "From the arrivals hall in Jeddah to the road between Makkah and Madinah, every transfer and ground arrangement is planned so no pilgrim is left waiting or unsure. Reliable vehicles, experienced drivers and coordination on the ground — so the journey is as peaceful as the destination.",
  },
] as const;

export const airlines = [
  "Qatar Airways",
  "Emirates",
  "Turkish Airlines",
  "PIA",
  "flynas",
  "flydubai",
  "Thai Airways",
  "airblue",
  "Jazeera Airways",
  "Gulf Air",
  "Air France",
  "AirSial",
];

const sq = (src: string, title: string, tag: string, chapter: string, size = 1400) =>
  ({ src: `/images/gallery/${src}.webp`, title, tag, chapter, width: size, height: size }) as const;

/**
 * About-page gallery, in story order: the Chairman and guests first, then milestones, then each branch
 * (agreement → welcome → celebration), then the team. Images live in public/images/gallery, compressed from
 * the client's originals in public/images/bin aziz gallery and public/images/moments with team.
 */
export const gallery = [
  // Leadership & guests
  sq("honoring-leadership", "Honoring our leadership", "Chairman", "Leadership & guests"),
  sq("chiniot-agreement", "Chiniot branch agreement, under our Chairman’s supervision", "Chairman", "Leadership & guests"),
  { src: "/images/gallery/amer-saeed-mian.webp", title: "Meeting Mr. Amer Saeed Mian, Chairman TAAP & Mian’s Group", tag: "Guest", chapter: "Leadership & guests", width: 1400, height: 1173 },
  sq("mian-zahoor-wattoo", "Honoured to meet Mian Zahoor Ahmad Wattoo", "Guest", "Leadership & guests"),
  { src: "/images/gallery/ceo-lahore-chamber.webp", title: "Our CEO at the Lahore Chamber of Commerce", tag: "Lahore", chapter: "Leadership & guests", width: 1800, height: 697 },
  sq("open-day-ribbon", "Welcoming our esteemed guests at Open Day 2025", "Open Day 2025", "Leadership & guests", 1080),
  sq("open-day-guest", "Our esteemed guest at Open Day 2025", "Open Day 2025", "Leadership & guests", 1080),
  sq("umrah-visa-agreement", "Umrah visa agreement signed", "Umrah 1448", "Leadership & guests"),
  sq("pak-abdullah-aviation-evening", "An evening of hospitality with Pak Abdullah Aviation", "Partners", "Leadership & guests"),
  sq("pak-abdullah-aviation-1", "Bin Aziz Group × Pak Abdullah Aviation", "Partners", "Leadership & guests"),
  sq("pak-abdullah-aviation-2", "Bin Aziz Group × Pak Abdullah Aviation", "Partners", "Leadership & guests"),
  sq("pak-abdullah-aviation-3", "Bin Aziz Group × Pak Abdullah Aviation", "Partners", "Leadership & guests"),
  sq("iftar-airblue", "Iftar dinner by Airblue", "Partners", "Leadership & guests"),
  { src: "/images/gallery/coo-salam-air.webp", title: "Our COO with the Salam Air team", tag: "Partners", chapter: "Leadership & guests", width: 1280, height: 960 },
  sq("moeen-mahmood-session", "Insightful session with Mr. Moeen Mahmood", "Guest", "Leadership & guests", 1080),
  // Milestones
  { src: "/images/gallery/directors-agm-saudi-2025.webp", title: "Directors’ AGM in Saudi Arabia", tag: "2025", chapter: "Milestones", width: 1800, height: 1121 },
  { src: "/images/gallery/agm-hotel-one-2026.webp", title: "AGM at Hotel One", tag: "2026", chapter: "Milestones", width: 1600, height: 1066 },
  { src: "/images/gallery/expo-dubai.webp", title: "Expo in Dubai", tag: "Exhibition", chapter: "Milestones", width: 1800, height: 1710 },
  { src: "/images/gallery/expo-saudi.webp", title: "Expo in Saudi Arabia", tag: "Exhibition", chapter: "Milestones", width: 1800, height: 1732 },
  // Branches
  sq("bahria-agreement-signing", "Our MD signs the Bahria Town branch agreement", "Bahria Town", "Branches"),
  sq("bahria-branch-signed", "Alhamdulillah, new branch signed", "Bahria Town", "Branches"),
  sq("shield-bahria-director", "Shield of honour for our new Bahria Town director", "Bahria Town", "Branches"),
  sq("layyah-director-welcome", "Welcoming our Layyah City branch director", "Layyah", "Branches", 1280),
  sq("welcome-layyah", "Welcome to Layyah", "Layyah", "Branches", 1080),
  // Celebrations
  sq("bahria-independence", "Independence Day at our Bahria Town branch", "14 August", "Celebrations"),
  sq("bahria-independence-cake", "Independence Day at our Bahria Town branch", "14 August", "Celebrations"),
  sq("lahore-city-independence-team", "Independence Day at our Lahore City branch", "14 August", "Celebrations"),
  sq("lahore-city-independence-cake", "Independence Day at our Lahore City branch", "14 August", "Celebrations"),
  sq("lahore-city-independence-office", "Independence Day at our Lahore City branch", "14 August", "Celebrations"),
  sq("layyah-independence", "Independence Day at our Layyah City branch", "14 August", "Celebrations"),
  // Our team
  sq("head-office-team", "Building tomorrow, together — our head office team", "Our team", "Our team"),
  sq("all-branches-meeting", "Head office meeting with teams from all branches", "Our team", "Our team", 1080),
  { src: "/images/gallery/team-meeting.webp", title: "Team meeting", tag: "Our team", chapter: "Our team", width: 1800, height: 1036 },
  sq("iftar-head-office", "Iftar gathering at our head office", "Ramadan", "Our team"),
  sq("three-years-dedication", "Celebrating three years of dedication", "Work anniversary", "Our team"),
  sq("coo-achievement", "An achievement moment for our COO", "Our team", "Our team", 1080),
  { src: "/images/gallery/our-office.webp", title: "Our office", tag: "Lahore", chapter: "Our team", width: 1800, height: 1800 },
] as const;
