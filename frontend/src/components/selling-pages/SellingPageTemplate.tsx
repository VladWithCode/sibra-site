import { useLayoutEffect, useRef } from "react";
import { WhatsappIcon } from "@/components/icons/whatsapp";
import { type SellingPageData } from "./defaults";
import { HeroSection } from "./HeroSection";
import { AvailabilitySection } from "./AvailabilitySection";
import { CardsSection } from "./CardsSection";
import { ContactSection } from "./ContactSection";
import { FinancingSection } from "./FinancingSection";
import { OfferSection } from "./OfferSection";
import { StepsSection } from "./StepsSection";
import { LocationSection } from "./LocationSection";
import { FooterContact } from "./FooterContact";

type SellingPageTemplateProps = {
    data: SellingPageData;
    preview?: boolean;
};

export function SellingPageTemplate({ data, preview = false }: SellingPageTemplateProps) {
    const rootRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (preview) return;
        const root = rootRef.current;
        if (!root) return;
        const els = Array.from(root.querySelectorAll<HTMLElement>(".sp-reveal"));
        if (!("IntersectionObserver" in window)) {
            els.forEach((e) => e.classList.add("in"));
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) {
                        e.target.classList.add("in");
                        io.unobserve(e.target);
                    }
                }
            },
            { threshold: 0.15 },
        );
        els.forEach((e) => io.observe(e));
        return () => io.disconnect();
    }, [preview]);

    return (
        <main
            ref={rootRef}
            className={`relative bg-white text-slate-900 antialiased${preview ? " sp-preview" : ""}`}
        >
            {(data.hero.title ||
                data.hero.subtitle ||
                data.hero.url) && (
                <HeroSection data={data.hero} alignment={data.alignment} />
            )}
            {data.availability.image && (
                <AvailabilitySection data={data.availability} alignment={data.alignment} />
            )}
            {data.cards.length > 0 && (
                <CardsSection
                    cards={data.cards}
                    footnote={data.cardsFootnote}
                    alignment={data.alignment}
                />
            )}
            {(data.contact.bgImage || data.whatsappHref) && (
                <ContactSection
                    data={data.contact}
                    alignment={data.alignment}
                    pageSlug={data.slug}
                    pageName={data.name}
                />
            )}
            {(data.financing.heading || data.financing.body || data.financing.image) && (
                <FinancingSection data={data.financing} />
            )}
            {(data.offer.price || data.offer.features.length > 0) && (
                <OfferSection data={data.offer} />
            )}
            {data.steps.length > 0 && <StepsSection steps={data.steps} />}
            {(data.location.mapEmbedUrl ||
                data.location.image ||
                data.location.chips.length > 0) && <LocationSection data={data.location} />}
            {(data.footer.heading || data.footer.phone || data.footer.address) && (
                <FooterContact
                    data={data.footer}
                    pageSlug={data.slug}
                    pageName={data.name}
                    whatsappHref={data.whatsappHref}
                />
            )}
            {!preview && data.whatsappHref && (
                <a
                    href={data.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Contactar por WhatsApp"
                    className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/30 text-white"
                >
                    <WhatsappIcon className="w-7 h-7" />
                </a>
            )}
        </main>
    );
}
