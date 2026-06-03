import type { TSellingPage } from "@/queries/type";
import {
    type Alignment,
    type SellingCard,
    type SellingChip,
    type SellingPageData,
    type SellingStep,
    conquistadoresDefaults,
} from "./defaults";

const UPLOADS_PREFIX = "/static/uploads/";

function str(v: unknown, def: string): string {
    return typeof v === "string" && v.trim() !== "" ? v : def;
}

/** Resolve an uploaded media filename to its public URL, else fall back. */
function media(v: unknown, def: string | undefined): string | undefined {
    if (typeof v === "string" && v.trim() !== "") {
        return v.startsWith("/") || v.startsWith("http") ? v : UPLOADS_PREFIX + v;
    }
    return def;
}

function arr<T>(v: unknown, def: T[]): T[] {
    return Array.isArray(v) && v.length > 0 ? (v as T[]) : def;
}

function variantOf(v: unknown): Alignment {
    return v === "left" || v === "center" || v === "right" ? v : "right";
}

/**
 * Merge a DB-backed page over the conquistadores defaults to produce a fully
 * populated SellingPageData. Empty/null fields fall back to defaults; defaults
 * are never mutated (a fresh object is built). Uploaded media filenames resolve
 * to /static/uploads/<file>; values already absolute (leading "/" or "http")
 * are kept as-is.
 */
export function mergeSellingPage(api: TSellingPage): SellingPageData {
    const d = conquistadoresDefaults;
    const hasVideo = typeof api.heroVideo === "string" && api.heroVideo.trim() !== "";

    return {
        slug: str(api.slug, d.slug),
        name: str(api.name, d.name),
        alignment: variantOf(api.variant),

        hero: {
            // A single uploaded video replaces the default multi-source set.
            videoWebm: hasVideo ? undefined : d.hero.videoWebm,
            videoMp4: hasVideo ? media(api.heroVideo, undefined) : d.hero.videoMp4,
            videoMov: hasVideo ? undefined : d.hero.videoMov,
            poster: media(api.heroPoster, d.hero.poster),
            image: media(api.heroImage, d.hero.image),
            title: str(api.heroTitle, d.hero.title),
            subtitle: str(api.heroSubtitle, d.hero.subtitle),
        },

        availability: {
            image: media(api.availabilityImg, d.availability.image)!,
            ctaLabel: d.availability.ctaLabel,
            planHref: str(api.availabilityCtaUrl, "") || undefined,
        },

        cards: arr<SellingCard>(api.cards, d.cards),
        cardsFootnote: d.cardsFootnote,

        contact: {
            bgImage: media(api.contactBgImg, d.contact.bgImage)!,
        },

        financing: {
            heading: str(api.financingHeading, d.financing.heading),
            body: str(api.financingBody, d.financing.body),
            image: media(api.financingImg, d.financing.image)!,
        },

        offer: {
            badge: d.offer.badge,
            price: str(api.offerPrice, d.offer.price),
            period: str(api.offerPeriod, d.offer.period),
            features: arr<string>(api.offerFeatures, d.offer.features),
            dimensionsLabel: d.offer.dimensionsLabel,
            dimensionsValue: str(api.offerDimensions, d.offer.dimensionsValue),
            landImage: media(api.offerLandImg, d.offer.landImage)!,
            // DB stores plain fine-print text; wrap as a single segment.
            finePrint:
                typeof api.offerFinePrint === "string" && api.offerFinePrint.trim() !== ""
                    ? [{ text: api.offerFinePrint }]
                    : d.offer.finePrint,
        },

        steps: arr<SellingStep>(api.steps, d.steps),

        location: {
            heading: d.location.heading,
            image: media(api.locationImg, d.location.image)!,
            mapEmbedUrl: str(api.locationMapEmbed, d.location.mapEmbedUrl),
            caption: str(api.locationCaption, d.location.caption),
            chips: arr<SellingChip>(api.locationChips, d.location.chips),
        },

        footer: {
            heading: d.footer.heading,
            address: str(api.contactAddress, d.footer.address),
            hours: str(api.contactHours, d.footer.hours),
            phone: str(api.contactPhone, d.footer.phone),
            phoneHref:
                typeof api.contactPhone === "string" && api.contactPhone.trim() !== ""
                    ? `tel:${api.contactPhone.replace(/\s+/g, "")}`
                    : d.footer.phoneHref,
            tagline: d.footer.tagline,
        },

        whatsappHref:
            typeof api.whatsappNumber === "string" && api.whatsappNumber.trim() !== ""
                ? `https://wa.me/${api.whatsappNumber}?text=${encodeURIComponent(
                      str(api.whatsappMessage, "Hola, me interesa más información."),
                  )}`
                : d.whatsappHref,
    };
}
