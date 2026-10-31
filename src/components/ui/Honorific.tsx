import { Fragment } from "react";

// The single ﷻ ligature is missing from most web fonts, so it is written out in Amiri instead.
export function Honorific() {
  return (
    <span className="font-arabic text-[0.9em] whitespace-nowrap" lang="ar">
      جل جلاله
    </span>
  );
}

/** Renders a string, swapping every ﷻ for <Honorific />. */
export function withHonorific(text: string) {
  return text.split("ﷻ").map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <Honorific />}
      {part}
    </Fragment>
  ));
}
