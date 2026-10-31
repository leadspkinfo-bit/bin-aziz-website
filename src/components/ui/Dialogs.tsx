"use client";

import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";

// Themed replacements for window.confirm / alert, available everywhere via useDialogs().

type Tone = "default" | "danger";
type ConfirmOptions = { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; tone?: Tone };
type ToastKind = "success" | "error" | "info";
type Toast = { id: number; kind: ToastKind; message: string };

type DialogApi = {
  /** Resolves true when the visitor confirms, false on cancel / Esc / backdrop click. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  notify: (message: string, kind?: ToastKind) => void;
};

const DialogContext = createContext<DialogApi | null>(null);

export function useDialogs() {
  const api = use(DialogContext);
  if (!api) throw new Error("useDialogs must be used inside <DialogProvider>");
  return api;
}

const toastStyles: Record<ToastKind, { icon: "check" | "close" | "badge"; ring: string; iconBg: string }> = {
  success: { icon: "check", ring: "border-emerald-400/40", iconBg: "bg-emerald-500 text-white" },
  error: { icon: "close", ring: "border-red-400/40", iconBg: "bg-red-500 text-white" },
  info: { icon: "badge", ring: "border-gold-500/40", iconBg: "bg-gold-500 text-night-950" },
};

export function DialogProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const close = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    dialogRef.current?.close();
    setOptions(null);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    resolver.current?.(false); // a newer dialog replaces any open one
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const notify = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  // Open the native <dialog> once its content is rendered (gives focus trap + Esc for free).
  useEffect(() => {
    if (options && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [options]);

  const danger = options?.tone === "danger";

  return (
    <DialogContext value={{ confirm, notify }}>
      {children}

      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          close(false);
        }}
        onClick={(e) => e.target === e.currentTarget && close(false)}
        className="m-auto w-[min(92vw,28rem)] overflow-hidden rounded-[2rem] border border-gold-500/25 bg-ivory-50 p-0 text-night-900 shadow-2xl backdrop:bg-night-950/70 backdrop:backdrop-blur-sm open:animate-[dialogIn_0.2s_ease-out]"
      >
        {options && (
          <div className="relative p-8">
            <div className="bg-islamic-pattern pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60" aria-hidden />
            <span
              className={`relative grid size-14 place-items-center rounded-full ${
                danger ? "bg-red-500/12 text-red-600" : "bg-gold-500/15 text-gold-600"
              }`}
            >
              <Icon name={danger ? "shield" : "badge"} className="size-7" />
            </span>
            <h2 className="relative mt-5 font-display text-3xl leading-tight">{options.title}</h2>
            {options.message && <p className="relative mt-3 text-ink/65">{options.message}</p>}
            <div className="relative mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-full border border-night-900/15 px-6 py-3 text-sm font-semibold transition hover:border-gold-500"
              >
                {options.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={`rounded-full px-6 py-3 text-sm font-semibold transition ${
                  danger ? "bg-red-600 text-white hover:bg-red-500" : "bg-night-900 text-ivory-50 hover:bg-night-700"
                }`}
              >
                {options.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        )}
      </dialog>

      <div className="pointer-events-none fixed inset-x-0 top-5 z-[200] flex flex-col items-center gap-3 px-4" aria-live="polite">
        {toasts.map((t) => {
          const s = toastStyles[t.kind];
          return (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex w-full max-w-sm animate-[toastIn_0.25s_ease-out] items-center gap-3 rounded-2xl border bg-night-900 px-4 py-3 text-sm text-ivory-50 shadow-2xl ${s.ring}`}
            >
              <span className={`grid size-7 shrink-0 place-items-center rounded-full ${s.iconBg}`}>
                <Icon name={s.icon} className="size-4" />
              </span>
              {t.message}
            </div>
          );
        })}
      </div>
    </DialogContext>
  );
}
