import type { TSellingPage } from "@/queries/type";
import type { TSellingPageInput } from "@/queries/sellingPages";
import z from "zod";

// Scalar form values. The four repeating fields are edited as JSON text
// (admin-friendly array UI deferred); media files are uploaded separately on the
// edit page, so media path fields are not part of this form.
export const SellingPageFormSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    slug: z
        .string()
        .min(1, "El slug es obligatorio")
        .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
    variant: z.enum(["left", "center", "right"]),
    published: z.boolean(),

    seoTitle: z.string(),
    seoDescription: z.string(),
    pixelId: z.string(),
    whatsappNumber: z.string(),
    whatsappMessage: z.string(),

    heroTitle: z.string(),
    heroSubtitle: z.string(),
    heroCtaLabel: z.string(),
    heroCtaTarget: z.string(),

    availabilityCtaUrl: z.string(),
    contactHeading: z.string(),

    financingHeading: z.string(),
    financingBody: z.string(),

    offerPrice: z.string(),
    offerPeriod: z.string(),
    offerDimensions: z.string(),
    offerFinePrint: z.string(),

    locationMapEmbed: z.string(),
    locationCaption: z.string(),

    contactAddress: z.string(),
    contactHours: z.string(),
    contactPhone: z.string(),

    // JSON text fields (validated at submit via parseJsonArray)
    offerFeaturesJson: z.string(),
    cardsJson: z.string(),
    stepsJson: z.string(),
    locationChipsJson: z.string(),
});

export type SellingPageFormValues = z.infer<typeof SellingPageFormSchema>;

export const sellingPageFormDefaults: SellingPageFormValues = {
    name: "",
    slug: "",
    variant: "right",
    published: false,
    seoTitle: "",
    seoDescription: "",
    pixelId: "",
    whatsappNumber: "",
    whatsappMessage: "",
    heroTitle: "",
    heroSubtitle: "",
    heroCtaLabel: "",
    heroCtaTarget: "",
    availabilityCtaUrl: "",
    contactHeading: "",
    financingHeading: "",
    financingBody: "",
    offerPrice: "",
    offerPeriod: "",
    offerDimensions: "",
    offerFinePrint: "",
    locationMapEmbed: "",
    locationCaption: "",
    contactAddress: "",
    contactHours: "",
    contactPhone: "",
    offerFeaturesJson: "",
    cardsJson: "",
    stepsJson: "",
    locationChipsJson: "",
};

/** Parse a JSON-text field into an array; empty -> null (use defaults). Throws on invalid JSON. */
function parseJsonArray(raw: string, label: string): unknown {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(trimmed);
    } catch {
        throw new Error(`JSON inválido en: ${label}`);
    }
    if (!Array.isArray(parsed)) {
        throw new Error(`${label} debe ser un arreglo JSON`);
    }
    return parsed;
}

/** Build the API payload from form values. Throws Error with a message on bad JSON. */
export function buildSellingPagePayload(values: SellingPageFormValues): TSellingPageInput {
    return {
        name: values.name,
        slug: values.slug,
        variant: values.variant,
        published: values.published,
        seoTitle: values.seoTitle,
        seoDescription: values.seoDescription,
        pixelId: values.pixelId,
        whatsappNumber: values.whatsappNumber,
        whatsappMessage: values.whatsappMessage,
        heroTitle: values.heroTitle,
        heroSubtitle: values.heroSubtitle,
        heroCtaLabel: values.heroCtaLabel,
        heroCtaTarget: values.heroCtaTarget,
        availabilityCtaUrl: values.availabilityCtaUrl,
        contactHeading: values.contactHeading,
        financingHeading: values.financingHeading,
        financingBody: values.financingBody,
        offerPrice: values.offerPrice,
        offerPeriod: values.offerPeriod,
        offerDimensions: values.offerDimensions,
        offerFinePrint: values.offerFinePrint,
        locationMapEmbed: values.locationMapEmbed,
        locationCaption: values.locationCaption,
        contactAddress: values.contactAddress,
        contactHours: values.contactHours,
        contactPhone: values.contactPhone,
        offerFeatures: parseJsonArray(values.offerFeaturesJson, "Características"),
        cards: parseJsonArray(values.cardsJson, "Tarjetas"),
        steps: parseJsonArray(values.stepsJson, "Pasos"),
        locationChips: parseJsonArray(values.locationChipsJson, "Chips de ubicación"),
    } as TSellingPageInput;
}

function jsonStr(v: unknown): string {
    if (v == null) return "";
    if (Array.isArray(v) && v.length === 0) return "";
    return JSON.stringify(v, null, 2);
}

/** Map an existing API page to form values (edit prefill). */
export function formValuesFromPage(page: TSellingPage): SellingPageFormValues {
    return {
        name: page.name ?? "",
        slug: page.slug ?? "",
        variant: (["left", "center", "right"].includes(page.variant)
            ? page.variant
            : "right") as SellingPageFormValues["variant"],
        published: !!page.published,
        seoTitle: page.seoTitle ?? "",
        seoDescription: page.seoDescription ?? "",
        pixelId: page.pixelId ?? "",
        whatsappNumber: page.whatsappNumber ?? "",
        whatsappMessage: page.whatsappMessage ?? "",
        heroTitle: page.heroTitle ?? "",
        heroSubtitle: page.heroSubtitle ?? "",
        heroCtaLabel: page.heroCtaLabel ?? "",
        heroCtaTarget: page.heroCtaTarget ?? "",
        availabilityCtaUrl: page.availabilityCtaUrl ?? "",
        contactHeading: page.contactHeading ?? "",
        financingHeading: page.financingHeading ?? "",
        financingBody: page.financingBody ?? "",
        offerPrice: page.offerPrice ?? "",
        offerPeriod: page.offerPeriod ?? "",
        offerDimensions: page.offerDimensions ?? "",
        offerFinePrint: page.offerFinePrint ?? "",
        locationMapEmbed: page.locationMapEmbed ?? "",
        locationCaption: page.locationCaption ?? "",
        contactAddress: page.contactAddress ?? "",
        contactHours: page.contactHours ?? "",
        contactPhone: page.contactPhone ?? "",
        offerFeaturesJson: jsonStr(page.offerFeatures),
        cardsJson: jsonStr(page.cards),
        stepsJson: jsonStr(page.steps),
        locationChipsJson: jsonStr(page.locationChips),
    };
}
