import { createClient as createSupabase } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

export const SETTINGS_TAG = "site-settings";

export type SettingKey =
  | "site_enabled"
  | "page_about"
  | "page_services"
  | "page_umrah_guide"
  | "umrah_journey"
  | "page_hajj_guide"
  | "page_calculator"
  | "page_packages"
  | "page_membership"
  | "page_contact"
  | "page_signup"
  | "home_intro"
  | "home_services"
  | "home_fleet"
  | "home_achievements"
  | "home_principles"
  | "home_cta"
  | "whatsapp_button"
  | "three_d"
  | "ticket_3d"
  | "block_inspect"
  | CalcSection;

/** The parts of the /calculator page, each with its own switch on /admin1998. */
/** `calc_packages` is the whole packages block: package cards, Add package, the buttons and the grand total. */
export const CALC_SECTIONS = ["calc_client", "calc_ticket", "calc_makkah", "calc_madina", "calc_children", "calc_notes", "calc_packages"] as const;
export type CalcSection = (typeof CALC_SECTIONS)[number];
export type CalcSections = Record<CalcSection, boolean>;

export type SettingRow = { key: SettingKey; label: string; grp: "global" | "pages" | "home" | "security" | "calculator"; enabled: boolean };
export type Settings = Record<SettingKey, boolean>;

// Until the table exists (or if it can't be reached) the site stays fully on.
const DEFAULTS: Settings = {
  site_enabled: true,
  page_about: true,
  page_services: true,
  page_umrah_guide: true,
  umrah_journey: true, // the planner and the journey stage on /umrah-guide
  page_hajj_guide: false, // still being built — stays hidden until switched on
  page_calculator: false, // stays hidden until the rate lists are loaded
  page_packages: true,
  page_membership: true,
  page_contact: true,
  page_signup: true,
  home_intro: true,
  home_services: true,
  home_fleet: true,
  home_achievements: true,
  home_principles: true,
  home_cta: true,
  whatsapp_button: true,
  three_d: false, // 3D fleet — plain cards unless the admin switches it on
  ticket_3d: false, // scrolling 3D ticket — plain hero unless switched on
  block_inspect: false,
  calc_client: true,
  calc_ticket: true,
  calc_makkah: true,
  calc_madina: true,
  calc_children: true,
  calc_notes: true,
  calc_packages: true,
};

/**
 * Public on/off switches, cached across requests and refreshed the moment an
 * admin flips one (the admin action calls updateTag(SETTINGS_TAG)).
 * Uses a cookie-less client because cached functions can't read the request.
 */
export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheTag(SETTINGS_TAG);

  const supabase = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.from("site_settings").select("key, enabled");
  if (error || !data?.length) {
    // Table missing or unreachable: fall back to "all on", but retry soon instead of caching that for weeks.
    cacheLife("minutes");
    return DEFAULTS;
  }
  cacheLife("max"); // admin changes invalidate the tag immediately
  const settings = { ...DEFAULTS };
  for (const row of data) if (row.key in settings) settings[row.key as SettingKey] = row.enabled;
  return settings;
}

/** Call at the top of a page: shows the 404 page while the admin has it switched off. */
export async function requirePage(key: SettingKey) {
  const settings = await getSettings();
  if (!settings[key]) notFound();
}

/** Nav href → the switch that controls it. */
export const pageKeyForHref: Record<string, SettingKey> = {
  "/about": "page_about",
  "/services": "page_services",
  "/umrah-guide": "page_umrah_guide",
  "/hajj-guide": "page_hajj_guide",
  "/calculator": "page_calculator",
  "/packages": "page_packages",
  "/membership": "page_membership",
  "/contact": "page_contact",
};
