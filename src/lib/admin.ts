import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * For admin pages (render inside <Suspense> — reads cookies).
 * Not signed in → redirect to /admin/login (and back to `from` after login). Signed in but not an admin → `isAdmin: false`.
 * Database policies enforce the same rule, so this is about showing the right screen.
 */
export async function getAdmin(from = "/admin") {
  // Supabase checks token expiry with Date.now(); keep this out of prerendering.
  await connection();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(from === "/admin" ? "/admin/login" : `/admin/login?next=${encodeURIComponent(from)}`);
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return { supabase, user: auth.user, isAdmin: Boolean(isAdmin) };
}

/** For server actions: returns the client and user id only when the caller is an admin. */
export async function adminClient() {
  const supabase = await createClient();
  const [{ data: auth }, { data: isAdmin }] = await Promise.all([supabase.auth.getUser(), supabase.rpc("is_admin")]);
  return auth.user && isAdmin ? { supabase, userId: auth.user.id } : null;
}
