// Business details used across the site — edit here, it updates everywhere.
export const site = {
  name: "Bin Aziz Tourism & Consultants",
  legalName: "Bin Aziz Tourism & Consultants (Pvt.) Ltd.",
  shortName: "Bin Aziz",
  tagline: "Umrah · Ticketing · Visas",
  description:
    "IATA licensed, Shariah-compliant travel company in Lahore. Umrah packages, worldwide air ticketing and visit visas.",
  url: "https://www.binaziz.com.pk",
  email: "info@binaziz.com.pk",
  phones: [
    { label: "+92 311 2462949", href: "tel:+923112462949" },
    { label: "+92 334 4270671", href: "tel:+923344270671" },
  ],
  whatsapp: "923112462949",
  address: {
    lines: [
      "Office No. M1 – M3, 1st Floor, Abbas Trade Center",
      "Main PIA Main Boulevard, near Javaid Nehari",
      "Block E, PIA Housing Scheme, Lahore 54000, Pakistan",
    ],
    query:
      "Abbas Trade Center, Main PIA Main Boulevard, Block E PIA Housing Scheme, Lahore 54000",
  },
} as const;

export function whatsappLink(text = "Assalam o Alaikum, I would like to know about your packages.") {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}

export const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/umrah-guide", label: "Umrah Guide" },
  { href: "/hajj-guide", label: "Hajj Guide" },
  { href: "/calculator", label: "Calculator" },
  { href: "/packages", label: "Packages" },
  { href: "/membership", label: "Become a Member" },
  { href: "/contact", label: "Contact" },
] as const;
