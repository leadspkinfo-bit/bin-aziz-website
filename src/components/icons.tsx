import type { ReactNode, SVGProps } from "react";
import type { IconName } from "@/lib/content";

const paths: Record<IconName | "arrow" | "phone" | "mail" | "pin" | "menu" | "close" | "check", ReactNode> = {
  kaaba: (
    <>
      <path d="M4 8.5 12 5l8 3.5v9L12 21l-8-3.5z" />
      <path d="M4 8.5 12 12l8-3.5M12 12v9" />
      <path d="M4 11.5 12 15l8-3.5" />
    </>
  ),
  plane: <path d="M10.5 3.5c.6-.6 1.9-.6 2.4.4l.3 6 6.8 3.6v1.9l-6.9-1.9-.4 4.6 2 1.6v1.5l-3.7-1-3.7 1v-1.5l2-1.6-.4-4.6L1.8 15.4v-1.9l6.8-3.6.3-6c.1-.2.2-.3.4-.4z" transform="rotate(45 12 12)" />,
  passport: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M9 16h6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />,
  whatsapp: (
    <>
      <path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.4 18.6z" />
      <path d="M9.2 8.6c.2-.4.6-.4.9-.4l.7 1.7-.6.8c.5 1 1.3 1.8 2.3 2.3l.8-.6 1.7.7c0 .3 0 .7-.4.9-.9.6-2 .5-3-.1a8 8 0 0 1-2.9-2.9c-.6-1-.7-2.1.5-2.4z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.8c2 .8 3.2 2.5 3.5 5.2" />
    </>
  ),
  badge: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="m8.5 14 -1.5 7 5-2.5 5 2.5-1.5-7" />
      <path d="m9.6 9 1.6 1.6 3.2-3.2" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  phone: <path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
};

export type AnyIcon = keyof typeof paths;

export function Icon({ name, className = "size-6", ...props }: { name: AnyIcon } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
