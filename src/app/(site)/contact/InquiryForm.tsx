"use client";

import { useSearchParams } from "next/navigation";
import { useActionState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { services } from "@/lib/content";
import { submitInquiry, type InquiryState } from "./actions";

const field =
  "mt-2 w-full rounded-xl border border-night-900/12 bg-white px-4 py-3.5 text-night-900 outline-none transition placeholder:text-ink/35 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/15";

function Label({ children, error, htmlFor }: { children: ReactNode; error?: string; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-night-900">
      {children}
      {error && <span className="ml-2 text-xs font-normal text-red-600">{error}</span>}
    </label>
  );
}

export function InquiryForm() {
  const preset = useSearchParams().get("service") ?? "umrah";
  const [state, action, pending] = useActionState<InquiryState, FormData>(submitInquiry, { status: "idle" });

  const v = state.values ?? {};

  if (state.status === "success") {
    return (
      <div className="grid min-h-96 place-items-center rounded-[2rem] border border-gold-500/25 bg-white p-10 text-center">
        <div>
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-gold-500 text-night-950">
            <Icon name="check" className="size-8" />
          </span>
          <h3 className="mt-6 font-display text-4xl text-night-900">Inquiry received</h3>
          <p className="mt-3 text-ink/65">{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <form key={JSON.stringify(v)} action={action} className="rounded-[2rem] border border-gold-500/25 bg-ivory-100/60 p-6 md:p-10" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" error={state.errors?.name}>Full name *</Label>
          <input id="name" name="name" defaultValue={v.name} required autoComplete="name" className={field} placeholder="Your name" />
        </div>
        <div>
          <Label htmlFor="phone" error={state.errors?.phone}>Phone / WhatsApp *</Label>
          <input id="phone" name="phone" defaultValue={v.phone} required type="tel" autoComplete="tel" className={field} placeholder="+92 3xx xxxxxxx" />
        </div>
        <div>
          <Label htmlFor="email" error={state.errors?.email}>Email</Label>
          <input id="email" name="email" defaultValue={v.email} type="email" autoComplete="email" className={field} placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="service">Service</Label>
          <select id="service" name="service" defaultValue={v.service ?? preset} className={field}>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="travellers">Travellers</Label>
          <input id="travellers" name="travellers" defaultValue={v.travellers} type="number" min={1} max={500} className={field} placeholder="e.g. 4" />
        </div>
        <div>
          <Label htmlFor="travel_month">Preferred month</Label>
          <input id="travel_month" name="travel_month" defaultValue={v.travel_month} type="month" className={field} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="message">Message</Label>
          <textarea id="message" name="message" defaultValue={v.message} rows={4} className={field} placeholder="Hotels, budget, departure city…" />
        </div>
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      </div>

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-night-900 px-7 py-4 font-semibold text-ivory-50 transition hover:bg-night-700 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Sending…" : "Send inquiry"}
        {!pending && <Icon name="arrow" className="size-4" />}
      </button>
    </form>
  );
}
