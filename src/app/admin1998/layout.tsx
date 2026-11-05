import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Same chrome as /admin, outside the (site) group so it works while the website is off.
export default function Admin1998Layout({ children }: LayoutProps<"/admin1998">) {
  return <div className="min-h-dvh flex-1 bg-night-950 text-ivory-50">{children}</div>;
}
