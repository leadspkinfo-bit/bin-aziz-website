"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { useDialogs } from "@/components/ui/Dialogs";
import { services } from "@/lib/content";
import { deleteInquiry, setInquiryStatus, type InquiryStatus } from "./actions";

export type Inquiry = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  service: string | null;
  travellers: number | null;
  travel_month: string | null;
  message: string | null;
  status: InquiryStatus;
};

const statusMeta: Record<InquiryStatus, { label: string; chip: string; button: string }> = {
  new: { label: "New", chip: "bg-red-500 text-white", button: "border-red-400/50 text-red-200" },
  contacted: { label: "Contacted", chip: "bg-gold-500 text-night-950", button: "border-gold-400/60 text-gold-300" },
  closed: { label: "Closed", chip: "bg-emerald-500 text-white", button: "border-emerald-400/50 text-emerald-200" },
};

const serviceTitle = (slug: string | null) => services.find((s) => s.slug === slug)?.title ?? slug;

const dateFmt = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Karachi",
});

function monthLabel(value: string) {
  const [y, m] = value.split("-").map(Number);
  return y && m ? new Date(y, m - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : value;
}

/** Digits only, Pakistani numbers normalised to 92… so wa.me links work. */
function waNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `92${digits.slice(1)}` : digits;
}

export function InquiriesList({ initial }: { initial: Inquiry[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<InquiryStatus | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { confirm, notify } = useDialogs();

  const counts = {
    all: items.length,
    new: items.filter((i) => i.status === "new").length,
    contacted: items.filter((i) => i.status === "contacted").length,
    closed: items.filter((i) => i.status === "closed").length,
  };
  const shown = filter === "all" ? items : items.filter((i) => i.status === filter);

  function changeStatus(inquiry: Inquiry, status: InquiryStatus) {
    if (inquiry.status === status) return;
    const previous = inquiry.status;
    setBusyId(inquiry.id);
    setItems((list) => list.map((i) => (i.id === inquiry.id ? { ...i, status } : i))); // optimistic
    startTransition(async () => {
      const result = await setInquiryStatus(inquiry.id, status);
      if (result.ok) notify(`${inquiry.name} marked as ${statusMeta[status].label.toLowerCase()}`);
      else {
        setItems((list) => list.map((i) => (i.id === inquiry.id ? { ...i, status: previous } : i)));
        notify(result.message, "error");
      }
      setBusyId(null);
    });
  }

  async function remove(inquiry: Inquiry) {
    const ok = await confirm({
      title: "Delete this inquiry?",
      message: `The inquiry from ${inquiry.name} will be removed permanently.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(inquiry.id);
    startTransition(async () => {
      const result = await deleteInquiry(inquiry.id);
      if (result.ok) {
        setItems((list) => list.filter((i) => i.id !== inquiry.id));
        notify("Inquiry deleted");
      } else notify(result.message, "error");
      setBusyId(null);
    });
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter inquiries">
        {(["all", "new", "contacted", "closed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              filter === f ? "border-gold-400 bg-gold-500 font-semibold text-night-950" : "border-ivory-100/15 text-ivory-100/70 hover:border-gold-500/50"
            }`}
          >
            {f === "all" ? "All" : statusMeta[f].label} <span className="opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-ivory-100/10 bg-night-900/60 p-12 text-center text-ivory-100/55">
          {items.length === 0 ? "No inquiries yet. They will appear here as soon as someone sends the contact form." : "Nothing in this list."}
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {shown.map((q) => {
            const busy = busyId === q.id;
            return (
              <li key={q.id} className={`rounded-[1.75rem] border border-ivory-100/10 bg-night-900/60 p-6 transition md:p-7 ${busy ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl">{q.name}</h2>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase ${statusMeta[q.status].chip}`}>
                        {statusMeta[q.status].label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ivory-100/45">{dateFmt.format(new Date(q.created_at))}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://wa.me/${waNumber(q.phone)}?text=${encodeURIComponent(`Assalam o Alaikum ${q.name}, this is Bin Aziz Tourism regarding your inquiry.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2 text-sm font-semibold text-white"
                    >
                      <Icon name="whatsapp" className="size-4" /> WhatsApp
                    </a>
                    <a href={`tel:${q.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 rounded-full border border-ivory-100/20 px-4 py-2 text-sm hover:border-gold-400">
                      <Icon name="phone" className="size-4" /> Call
                    </a>
                    {q.email && (
                      <a href={`mailto:${q.email}`} className="inline-flex items-center gap-2 rounded-full border border-ivory-100/20 px-4 py-2 text-sm hover:border-gold-400">
                        <Icon name="mail" className="size-4" /> Email
                      </a>
                    )}
                  </div>
                </div>

                <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Phone", q.phone],
                    ["Email", q.email],
                    ["Service", serviceTitle(q.service)],
                    ["Travellers", q.travellers],
                    ["Preferred month", q.travel_month && monthLabel(q.travel_month)],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k as string}>
                        <dt className="text-[11px] tracking-widest text-ivory-100/40 uppercase">{k}</dt>
                        <dd className="mt-0.5 break-words text-ivory-50">{v}</dd>
                      </div>
                    ))}
                </dl>
                {q.message && <p className="mt-5 rounded-2xl bg-night-950/60 p-4 text-sm whitespace-pre-line text-ivory-100/80">{q.message}</p>}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ivory-100/10 pt-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="self-center text-xs text-ivory-100/45">Mark as:</span>
                    {(["new", "contacted", "closed"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={busy}
                        onClick={() => changeStatus(q, s)}
                        aria-pressed={q.status === s}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                          q.status === s ? statusMeta[s].chip + " border-transparent" : statusMeta[s].button + " hover:bg-ivory-100/5"
                        }`}
                      >
                        {statusMeta[s].label}
                      </button>
                    ))}
                  </div>
                  <button type="button" disabled={busy} onClick={() => remove(q)} className="text-xs text-ivory-100/45 transition hover:text-red-300">
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
