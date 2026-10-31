import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons";
import { site, whatsappLink } from "@/lib/site";

export function CallToAction() {
  return (
    <section className="bg-ivory-100 pb-24 md:pb-32">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-night-900 px-8 py-16 text-center text-ivory-50 md:px-16 md:py-24">
          <div className="bg-islamic-pattern absolute inset-0" aria-hidden />
          <div className="absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-gold-500/25 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="font-arabic text-2xl text-gold-400" lang="ar" dir="rtl">
              وَأَتِمُّوا الْحَجَّ وَالْعُمْرَةَ لِلَّهِ
            </p>
            <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl leading-tight font-medium md:text-6xl">
              Ready to answer the call? <span className="text-gold-gradient italic">Let’s plan your Umrah.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-ivory-100/65">
              Share your dates and group size — our team will get back to you with options that fit your intention
              and budget.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button href="/contact">Send an inquiry</Button>
              <Button href={whatsappLink()} external variant="outline" arrow={false}>
                <Icon name="whatsapp" className="size-4" /> WhatsApp {site.phones[0].label}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
