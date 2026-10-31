import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Deliberately outside the (site) group: no public header/footer, and it keeps
// working while the website is switched off.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh flex-1 bg-night-950 text-ivory-50">{children}</div>;
}
