import { Icon } from "@/components/icons";
import { whatsappLink } from "@/lib/site";

export function WhatsAppFab() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed right-5 bottom-5 z-40 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_-8px_rgb(37_211_102/0.7)] transition hover:scale-105"
    >
      <Icon name="whatsapp" className="size-7" strokeWidth={1.7} />
    </a>
  );
}
