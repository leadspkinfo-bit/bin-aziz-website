"use client";

import { useRouter } from "next/navigation";
import { lockControls } from "./actions";

export function LockControls() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await lockControls();
        router.refresh(); // controls section disappears again
      }}
      className="rounded-full border border-gold-500/50 px-5 py-2.5 text-sm text-gold-300 transition hover:bg-gold-500/10"
    >
      Lock controls
    </button>
  );
}
