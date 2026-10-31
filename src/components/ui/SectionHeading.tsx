import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  text?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
};

export function SectionHeading({ eyebrow, title, text, align = "left", tone = "light" }: Props) {
  const dark = tone === "dark";
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p
        className={`inline-flex items-center gap-3 text-xs font-semibold tracking-[0.3em] uppercase ${
          dark ? "text-gold-400" : "text-gold-600"
        } ${align === "center" ? "justify-center" : ""}`}
      >
        <span className="h-px w-8 bg-current" />
        {eyebrow}
        {align === "center" && <span className="h-px w-8 bg-current" />}
      </p>
      <h2
        className={`mt-5 font-display text-4xl leading-[1.05] font-medium md:text-6xl ${
          dark ? "text-ivory-50" : "text-night-900"
        }`}
      >
        {title}
      </h2>
      {text && (
        <p className={`mt-6 text-base leading-relaxed md:text-lg ${dark ? "text-ivory-100/70" : "text-ink/70"}`}>
          {text}
        </p>
      )}
    </div>
  );
}
