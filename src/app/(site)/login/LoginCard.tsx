"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { useUser } from "@/components/auth/useUser";

export function LoginCard() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/packages";
  const failed = params.has("error");
  const user = useUser();

  return (
    <div className="rounded-[2rem] bg-ivory-50 p-8 text-night-900 shadow-2xl md:p-12">
      {user ? (
        <>
          <h2 className="font-display text-4xl">You’re signed in</h2>
          <p className="mt-3 text-ink/65">Assalam o Alaikum, {user.user_metadata?.full_name ?? user.email}. All package details are open for you.</p>
          <Link href="/packages" className="mt-8 inline-flex rounded-full bg-night-900 px-7 py-3.5 font-semibold text-ivory-50 transition hover:bg-night-700">
            View packages
          </Link>
        </>
      ) : (
        <>
          <h2 className="font-display text-4xl">Create your free account</h2>
          <p className="mt-3 mb-7 text-ink/65">Use your email and a password, or sign up with Google in one click.</p>
          {failed && (
            <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              Sign-in didn’t complete. Please try again.
            </p>
          )}
          <EmailAuthForm next={next} />
          <div className="my-10 flex items-center gap-5 text-sm tracking-[0.25em] text-ink/50 uppercase">
            <span className="h-px flex-1 bg-night-900/15" /> or <span className="h-px flex-1 bg-night-900/15" />
          </div>
          <GoogleButton next={next} />
          <p className="mt-6 text-xs text-ink/50">We only use your name and email to give you access. We never post anything.</p>
        </>
      )}
    </div>
  );
}
