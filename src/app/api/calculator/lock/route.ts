import { revokeCalculatorAdmin } from "@/lib/calcAccess";

/**
 * Locks the calculator's ADMIN again. Called with navigator.sendBeacon when the page is left (back,
 * reload, another site, tab closed), where a server action can't finish in time.
 */
export async function POST() {
  await revokeCalculatorAdmin();
  return new Response(null, { status: 204 });
}
