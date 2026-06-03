import { useGSAP } from "@gsap/react";
import { useLayoutEffect, useRef } from "react";
import { WhatsappIcon } from "@/components/icons/whatsapp";
import { animateSection } from "./animations";
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
    /** Static render for admin preview: forces sections visible, skips the
     *  scroll observer + the fixed floating WhatsApp button. */
    preview?: boolean;
};

/**
 * Reusable Selling Page template. Variant-driven top sections (hero,
 * availability, cards, contact) honor `data.alignment`; the lower sections
 * (financing, offer, steps, location, footer) keep a fixed layout. Owns the
 * IntersectionObserver + GSAP reveal that the conquistadores landing used.
 */
export function SellingPageTemplate({ data, preview = false }: SellingPageTemplateProps) {
    const mainContentRef = useRef<HTMLDivElement>(null);
    const { contextSafe } = useGSAP({ scope: mainContentRef });
    const safeAnimateSection = contextSafe(animateSection);

    useLayoutEffect(() => {
        if (preview) return; // preview is static; no scroll animations
        if (!mainContentRef.current) return;

        const obsv = new IntersectionObserver(
            (ents, obsv) => {
                for (const ent of ents) {
                    if (ent.isIntersecting) {
                        safeAnimateSection(ent.target as HTMLElement, obsv);
                        obsv.unobserve(ent.target);
                    }
                }
            },
            { threshold: 0.35 },
        );

        mainContentRef.current.querySelectorAll("section").forEach((el) => {
            obsv.observe(el);
        });

        return () => {
            obsv.disconnect();
        };
    }, [mainContentRef.current, preview]);

    return (
        <main
            className={`relative bg-sbr-blue-dark text-primary-foreground${preview ? " sp-preview" : ""}`}
            ref={mainContentRef}
        >
            <HeroSection data={data.hero} alignment={data.alignment} />
            <AvailabilitySection data={data.availability} alignment={data.alignment} />
            <CardsSection
                cards={data.cards}
                footnote={data.cardsFootnote}
                alignment={data.alignment}
            />
            <ContactSection
                data={data.contact}
                alignment={data.alignment}
                pageSlug={data.slug}
                pageName={data.name}
            />
            <FinancingSection data={data.financing} />
            <OfferSection data={data.offer} />
            <StepsSection steps={data.steps} />
            <LocationSection data={data.location} />
            <FooterContact data={data.footer} pageSlug={data.slug} pageName={data.name} />
            {!preview && (
                <a
                    href={data.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-fixed"
                >
                    <WhatsappIcon className="text-gray-50 size-8" />
                    <span className="sr-only">Envianos un WhatsApp</span>
                </a>
            )}
        </main>
    );
}
