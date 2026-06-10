import type { TSellingPage } from "@/queries/type";
import {
    type Alignment,
    type SellingCard,
    type SellingChip,
    type SellingPageData,
    type SellingStep,
} from "./defaults";

const UPLOADS_PREFIX = "/static/uploads/";

function str(v: unknown): string {
    return typeof v === "string" ? v : "";
}

/** Resolve an uploaded media filename to its public URL. */
function media(v: unknown): string | undefined {
    if (typeof v === "string" && v.trim() !== "") {
        return v.startsWith("/") || v.startsWith("http") ? v : UPLOADS_PREFIX + v;
    }
    return undefined;
}

function arr<T>(v: unknown): T[] {
    return Array.isArray(v) && v.length > 0 ? (v as T[]) : [];
}

function variantOf(v: unknown): Alignment {
    return v === "left" || v === "center" || v === "right" ? v : "left";
}

/**
 * Build a SellingPageData object from a DB-backed page.
 * No defaults are applied — every field comes from the API payload.
 * Uploaded media filenames resolve to /static/uploads/<file>; values already
 * absolute (leading "/" or "http") are kept as-is.
 */
export function mergeSellingPage(api: TSellingPage): SellingPageData {
    const hasVideo = typeof api.heroVideo === "string" && api.heroVideo.trim() !== "";
    const whatsMsg =
        typeof api.whatsappMessage === "string" && api.whatsappMessage.trim() !== ""
            ? api.whatsappMessage
            : "Hola, me interesa más información.";

    return {
        slug: str(api.slug),
        name: str(api.name),
        alignment: variantOf(api.variant),

        hero: {
            videoWebm: undefined,
            videoMp4: hasVideo ? media(api.heroVideo) : undefined,
            videoMov: undefined,
            poster: media(api.heroPoster),
            image: media(api.heroImage),
            title: str(api.heroTitle),
            subtitle: str(api.heroSubtitle),
        },

        availability: {
            image: media(api.availabilityImg) ?? "",
            ctaLabel: str(api.heroCtaLabel),
        },

        cards: arr<SellingCard>(api.cards),
        cardsFootnote: "",

        contact: {
            bgImage: media(api.contactBgImg) ?? "",
        },

        financing: {
            heading: str(api.financingHeading),
            body: str(api.financingBody),
            image: media(api.financingImg) ?? "",
        },

        offer: {
            badge: "",
            price: str(api.offerPrice),
            period: str(api.offerPeriod),
            features: arr<string>(api.offerFeatures),
            dimensionsLabel: "",
            dimensionsValue: str(api.offerDimensions),
            landImage: media(api.offerLandImg) ?? "",
            finePrint:
                typeof api.offerFinePrint === "string" && api.offerFinePrint.trim() !== ""
                    ? [{ text: api.offerFinePrint }]
                    : [],
        },

        steps: arr<SellingStep>(api.steps),

        location: {
            heading: "",
            image: media(api.locationImg) ?? "",
            mapEmbedUrl: str(api.locationMapEmbed),
            caption: str(api.locationCaption),
            chips: arr<SellingChip>(api.locationChips),
        },

        footer: {
            heading: str(api.contactHeading),
            address: str(api.contactAddress),
            hours: str(api.contactHours),
            phone: str(api.contactPhone),
            phoneHref:
                typeof api.contactPhone === "string" && api.contactPhone.trim() !== ""
                    ? `tel:${api.contactPhone.replace(/\s+/g, "")}`
                    : "",
            tagline: "",
        },

        whatsappHref:
            typeof api.whatsappNumber === "string" && api.whatsappNumber.trim() !== ""
                ? `https://wa.me/${api.whatsappNumber}?text=${encodeURIComponent(whatsMsg)}`
                : "",
    };
}
