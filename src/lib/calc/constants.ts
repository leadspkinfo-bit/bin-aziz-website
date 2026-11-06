export const SAR_TO_PKR = 78;
export const PROFIT_PKR = 20000;
export const MAKKAH_ZIYARAT_SAR = 10;
export const MADINA_ZIYARAT_SAR = 10;
export const INFANT_PRICE_PKR = 95000;

export const ROOM_TYPES = ["sharing", "quint", "quad", "triple", "double"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export const ROOM_CAPACITY: Record<RoomType, number> = { sharing: 6, quint: 5, quad: 4, triple: 3, double: 2 };
export const SCAN_DIVISOR = ROOM_CAPACITY;

export const MAX_SYNC_IMAGES = 20;
export const SCAN_MAX_DIMENSION = 2500;
export const SCAN_JPEG_QUALITY = 0.88;
export const GEMINI_MAX_TOKENS = 32768;
export const GEMINI_RETRIES = 3;
export const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash"];

export const RATES_TAG = "rates";
export const STANDARD_RATES = "Standard Rates";

export const BRAND = {
  maroon: "#8e1b34",
  navy: "#044064",
  gold: "#FFDF00",
  helpline: "042 37874760 | +92 311 2462949",
  address: "Office M1-M2-M3, 1st Floor, Abbas Trade Center, Main PIA Road, Lahore",
};

export const BRANCHES = ["HEAD OFFICE (Lahore)", "LAHORE CITY", "CHINIOT", "LAYYAH CITY", "KHUSHAB"];

export const AIRLINES = [
  "NONE",
  "SAUDI AIRLINE",
  "FLYNAS",
  "AIR BLUE",
  "AIR SIAL",
  "PIA",
  "FLY ADEAL",
  "FLY JINNAH",
  "AIR ARABIA",
  "EMIRATES",
  "ETIHAD",
  "QATAR",
  "BRITISH AIRWAYS",
  "CUSTOM AIRLINE",
];
