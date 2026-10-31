"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { unlockControls } from "./actions";

/**
 * Invisible: collects digits typed anywhere on the page (outside form fields).
 * Six digits (up to 10 s apart) are checked against the admin's authenticator
 * code; a match reveals the website controls at the top of this page. Nothing
 * is shown for a wrong code.
 */
export function SecretUnlock() {
  const router = useRouter();
  const buffer = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const checking = useRef(false);

  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]") || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!/^\d$/.test(e.key)) {
        buffer.current = "";
        return;
      }
      buffer.current = (buffer.current + e.key).slice(-6);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => (buffer.current = ""), 10_000);

      if (buffer.current.length === 6 && !checking.current) {
        const code = buffer.current;
        buffer.current = "";
        checking.current = true;
        const { ok } = await unlockControls(code);
        checking.current = false;
        if (ok) {
          window.scrollTo({ top: 0, behavior: "smooth" });
          router.refresh(); // server re-renders /admin with the controls section
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer.current);
    };
  }, [router]);

  return null;
}
