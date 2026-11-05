"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { unlockCalculator } from "@/app/(site)/calculator/actions";

/** Asks for the 6-digit access code before the calculator is shown. */
export function CodeGate() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const res = await unlockCalculator(code);
      if (!res.ok) {
        setError(true);
        setCode("");
        return;
      }
      router.refresh();
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.length === 6) submit();
      }}
      className="mx-auto max-w-sm rounded-2xl border border-t-8 border-slate-200 border-t-[#8e1b34] bg-white p-8 text-center text-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.1)]"
    >
      <p className="text-lg font-extrabold tracking-[1.5px] text-[#044064]">𝐁𝐈𝐍 𝐀𝐙𝐈𝐙 𝐆𝐑𝐎𝐔𝐏</p>
      <h1 className="text-xl font-bold text-[#8e1b34]">UMRAH CALCULATOR</h1>
      <label htmlFor="calc-code" className="mt-6 block text-sm font-semibold text-slate-600">
        Enter the 6-digit access code
      </label>
      <input
        id="calc-code"
        autoFocus
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
          setError(false);
        }}
        className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-[#8e1b34] focus:ring-3 focus:ring-[#8e1b34]/10"
      />
      <p aria-live="polite" className="mt-2 h-5 text-sm text-red-600">
        {error ? "Wrong code. Please try again." : ""}
      </p>
      <button
        type="submit"
        disabled={code.length !== 6 || pending}
        className="mt-2 w-full rounded-xl bg-[#8e1b34] py-3 text-sm font-bold tracking-wide text-white uppercase shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? "Checking…" : "Open calculator"}
      </button>
    </form>
  );
}
