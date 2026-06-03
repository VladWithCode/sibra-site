// Selling Page data model + reference (conquistadores) defaults.
//
// Phase 1: frontend-only. These types drive the reusable SellingPageTemplate.
// The conquistadores route renders the template with `conquistadoresDefaults`,
// reproducing the original hardcoded design exactly (alignment = "right").

export type Alignment = "left" | "center" | "right";

export type SellingCard = {
    title: string;
    description: string;
    image: string;
};

export type SellingStep = {
    step: number;
    title: string;
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
        videoWebm?: string;
        videoMp4?: string;
        videoMov?: string;
        poster?: string;
        /** Fallback image when no video is set. */
        image?: string;
        title: string;
        subtitle: string;
    };

    availability: {
        image: string;
        ctaLabel: string;
        /** Optional external URL. When set, "Ver Plano" opens it; otherwise a lightbox of `image`. */
        planHref?: string;
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

export const conquistadoresDefaults: SellingPageData = {
    slug: "conquistadores",
    name: "Conquistadores",
    alignment: "right",
    hero: {
        videoWebm: "/conquistadores_hero.webm",
        videoMp4: "/conquistadores_hero.mp4",
        videoMov: "/conquistadores_hero.mov",
        poster: "/conq_video_poster.webp",
        title: "Conquistadores",
        subtitle:
            "Servicios completos · Acceso controlado · Financiamiento directo sin intereses.",
    },
    availability: {
        image: "/disp1.webp",
        ctaLabel: "Ver Plano",
    },
    cards: [
        {
            title: "Listos para escriturar",
            description: "Tu terreno, con documentos en regla y escritura lista para firmar.",
            image: "/listosparaescriturar.webp",
        },
        {
            title: "Servicios completos",
            description:
                "Servicios en proceso. Inversión segura con obra garantizada en próximos meses.",
            image: "/servicioscompletos.webp",
        },
        {
            title: "Privada segura",
            description:
                "Acceso controlado, áreas verdes y la tranquilidad de un entorno familiar seguro.",
            image: "/psegura.webp",
        },
    ],
    cardsFootnote: "Más que un desarrollo, es un espacio listo para vivir o invertir.",
    contact: {
        bgImage: "/agent_showcase.webp",
    },
    financing: {
        heading: "Financiamiento",
        body: "Invierte fácil, sin bancos y sin intereses.",
        image: "/agent_showcase_2.webp",
    },
    offer: {
        badge: "Oferta",
        price: "$36,458",
        period: "MES",
        features: [
            "Agua, luz y drenaje.",
            "Plusvalía.",
            "Áreas verdes.",
            "Privacidad y seguridad.",
            "Pie de Blvd.",
        ],
        dimensionsLabel: "Dimensiones",
        dimensionsValue: "10m x 25m",
        landImage: "/land.webp",
        finePrint: [
            { text: "*Enganche desde " },
            { text: "$218,750 MXN", strong: true },
            { text: " · Resto en " },
            { text: "18 meses sin intereses", strong: true },
            { text: "." },
        ],
    },
    steps: [
        {
            step: 1,
            title: "Agenda Cita",
            description: ["Contactanos para conocer el desarrollo."],
        },
        {
            step: 2,
            title: "Aparta tu lote",
            description: ["Aprovecha esta gran oferta...", "¡Ultimos 11 lotes disponibles!"],
        },
        {
            step: 3,
            title: "Entrega del terreno",
            description: ["Recibe tu terreno contra-anticipo."],
        },
        {
            step: 4,
            title: "Construye",
            description: ["Junto a tus seres queridos da un paso a su patrimonio seguro."],
        },
    ],
    location: {
        heading: "Ubicación",
        image: "/sample.webp",
        mapEmbedUrl:
            "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d2249.4186266257207!2d-104.6054537871626!3d23.99755376264779!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjPCsDU5JzUxLjUiTiAxMDTCsDM2JzE2LjkiVw!5e1!3m2!1sen!2smx!4v1760571453942!5m2!1sen!2smx",
        caption:
            "Unete a +30 familias Clientes que ya aseguraron su terreno y construyeron su patrimonio.",
        chips: [
            { text: "Espaldas de la Feria Nacional de Durango." },
            { text: "Lunes a domingo. 9:00 a.m. – 6:00 p.m." },
            { text: "Plusvalía." },
        ],
    },
    footer: {
        heading: "Agenda tu visita o contáctanos",
        address: "C. Cancer #132. Fracc. Sahop, 34190 Durango. Dgo.",
        hours: "Lunes a domingo · 9:00 a.m. – 6:00 p.m.",
        phone: "618 229 8042",
        phoneHref: "tel:6182298042",
        tagline: "Terrenos listos. Escritura lista. Solo faltas tú.",
    },
    whatsappHref:
        "https://wa.me/5216182298042?text=¡Hola! Me gustaría obtener más información de Conquistadores.",
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
