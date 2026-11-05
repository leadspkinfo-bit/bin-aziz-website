"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Spo } from "@/lib/spos";

/**
 * "Prepared By": a searchable pick from the admin's SPO list. Only listed names can be chosen (no free
 * text), so every quotation is counted against exactly one SPO.
 */
export function SpoPicker({ id, spos, value, onChange }: { id: string; spos: Spo[]; value: string; onChange: (spo: Spo) => void }) {
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const q = query.trim().toLowerCase();
  const shown = q ? spos.filter((s) => s.name.toLowerCase().includes(q)) : spos;
  const selected = spos.find((s) => s.id === value);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const choose = (s: Spo) => {
    onChange(s);
    setOpen(false);
    setQuery("");
    button.current?.focus();
  };
  const show = () => {
    setActive(Math.max(0, spos.findIndex((s) => s.id === value)));
    setQuery("");
    setOpen(true);
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            show();
          }
        }}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white p-2 text-left text-sm text-slate-800 outline-none transition focus:border-[#8e1b34] focus:ring-3 focus:ring-[#8e1b34]/10"
      >
        <span className={`truncate ${selected ? "" : "text-slate-500"}`}>{selected?.name ?? (spos.length ? "Select your name" : "No SPO names yet")}</span>
        <svg aria-hidden viewBox="0 0 20 20" className={`size-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}>
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-[60] mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <input
            autoFocus
            aria-label="Search name"
            aria-controls={listId}
            aria-activedescendant={shown[active] ? `${listId}-${shown[active].id}` : undefined}
            placeholder="Type your name…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, shown.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (shown[active]) choose(shown[active]);
              } else if (e.key === "Escape") {
                setOpen(false);
                button.current?.focus();
              }
            }}
            className="w-full border-b border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none"
          />
          <ul id={listId} role="listbox" aria-label="Prepared By" className="max-h-64 overflow-y-auto py-1">
            {shown.length === 0 && <li className="px-3 py-3 text-sm text-slate-500">{spos.length ? "No name matches — ask the admin to add you." : "The admin hasn't added any names yet."}</li>}
            {shown.map((s, i) => (
              <li
                key={s.id}
                id={`${listId}-${s.id}`}
                role="option"
                aria-selected={s.id === value}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(s)}
                className={`cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-[#e0f2fe]" : ""} ${s.id === value ? "font-semibold text-[#8e1b34]" : "text-slate-800"}`}
              >
                {s.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
