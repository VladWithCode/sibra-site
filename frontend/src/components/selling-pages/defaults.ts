// Selling Page data model.
// These types drive the reusable SellingPageTemplate.

import type { IconName } from "lucide-react/dynamic";

export type Alignment = "left" | "center" | "right";

export type SellingCard = {
    title: string;
    description: string;
    image: string;
};

export type SellingStep = {
    step: number;
    title: string;
    icon: IconName;
    description: string[];
};

export type SellingChip = {
    text: string;
};

/** One segment of rich fine-print text; `strong` renders bold (no HTML injection). */
export type FinePrintSegment = {
    text: string;
    strong?: boolean;
};

export type SellingPageData = {
    /** Page identity, used for lead attribution. */
    slug: string;
    name: string;
    /** Drives the variant-aware top sections (hero, availability, cards, contact). */
    alignment: Alignment;

    hero: {
        type: "image" | "video";
        url: string;
        title: string;
        subtitle: string;
    };

    availability: {
        image: string;
        planImage: string;
        ctaLabel: string;
    };

    cards: SellingCard[];
    cardsFootnote?: string;

    contact: {
        bgImage: string;
    };

    financing: {
        heading: string;
        body: string;
        image: string;
    };

    offer: {
        badge: string;
        price: string;
        period: string;
        features: string[];
        dimensionsLabel: string;
        dimensionsValue: string;
        landImage: string;
        finePrint: FinePrintSegment[];
    };

    steps: SellingStep[];

    location: {
        heading: string;
        image: string;
        mapEmbedUrl: string;
        caption: string;
        chips: SellingChip[];
    };

    footer: {
        heading: string;
        address: string;
        hours: string;
        phone: string;
        phoneHref: string;
        tagline: string;
    };

    /** Floating WhatsApp button target (full wa.me URL with prefilled message). */
    whatsappHref: string;
};

/** Tailwind text-alignment per variant for the variant-driven top sections. */
export function alignText(alignment: Alignment): string {
    switch (alignment) {
        case "left":
            return "text-start";
        case "center":
            return "text-center";
        default:
            return "text-end";
    }
}

/** Flex cross-axis alignment per variant. */
export function alignItems(alignment: Alignment): string {
    switch (alignment) {
        case "left":
            return "items-start";
        case "center":
            return "items-center";
        default:
            return "items-end";
    }
}

/** Flex main-axis justification per variant. */
export function justifySide(alignment: Alignment): string {
    switch (alignment) {
        case "left":
            return "justify-start";
        case "center":
            return "justify-center";
        default:
            return "justify-end";
    }
}
