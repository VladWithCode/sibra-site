import type { TSellingPage } from "@/queries/type";
import type { TSellingPageInput } from "@/queries/sellingPages";
import z from "zod";

// Visual (non-JSON) form value shapes for the repeating fields.
export type FormCard = { title: string; description: string; image: string };
export type FormStep = {
    step: string;
    title: string;
    descriptionText: string; // one line per renglón; split into string[] on submit
    icon: string;
};

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

    // Visual repeating fields (no JSON typing required by the admin)
    offerFeatures: z.array(z.string()),
    cards: z.array(
        z.object({
            title: z.string(),
            description: z.string(),
            image: z.string(),
        }),
    ),
    steps: z.array(
        z.object({
            step: z.string(),
            title: z.string(),
            descriptionText: z.string(),
            icon: z.string(),
        }),
    ),
    chips: z.array(z.string()),
});

export type SellingPageFormValues = z.infer<typeof SellingPageFormSchema>;

export const sellingPageFormDefaults: SellingPageFormValues = {
    name: "",
    slug: "",
    variant: "left",
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
    offerFeatures: [],
    cards: [],
    steps: [],
    chips: [],
};

function splitLines(text: string): string[] {
    return text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== "");
}

/** Build the API payload from form values (visual fields -> backend JSON shapes).
 *  `basePage` preserves media fields so the PUT doesn't overwrite them with empties. */
export function buildSellingPagePayload(
    values: SellingPageFormValues,
    basePage?: Partial<TSellingPage>,
): TSellingPageInput {
    const features = values.offerFeatures.map((f) => f.trim()).filter((f) => f !== "");

    const cards = values.cards
        .filter((c) => c.title.trim() || c.description.trim() || c.image.trim())
        .map((c) => ({
            title: c.title.trim(),
            description: c.description.trim(),
            image: c.image.trim(),
        }));

    const steps = values.steps
        .filter((s) => s.step.trim() || s.title.trim() || s.descriptionText.trim())
        .map((s, i) => ({
            step: Number(s.step) || i + 1,
            title: s.title.trim(),
            description: splitLines(s.descriptionText),
            icon: s.icon.trim(),
        }));

    const chips = values.chips
        .map((t) => t.trim())
        .filter((t) => t !== "")
        .map((text) => ({ text }));

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
        // External URL was removed per feedback; always send empty to keep
        // backend column (NOT NULL DEFAULT '') happy + records intact.
        availabilityCtaUrl: "",
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
        offerFeatures: features.length > 0 ? features : null,
        cards: cards.length > 0 ? cards : null,
        steps: steps.length > 0 ? steps : null,
        locationChips: chips.length > 0 ? chips : null,
        // Preserve media fields from the original page so the PUT doesn't wipe them.
        ...(basePage?.heroMedia ? { heroMedia: basePage.heroMedia, heroMediaType: basePage.heroMediaType } : {}),
        ...(basePage?.availabilityImg ? { availabilityImg: basePage.availabilityImg } : {}),
        ...(basePage?.contactBgImg ? { contactBgImg: basePage.contactBgImg } : {}),
        ...(basePage?.financingImg ? { financingImg: basePage.financingImg } : {}),
        ...(basePage?.offerLandImg ? { offerLandImg: basePage.offerLandImg } : {}),
        ...(basePage?.locationImg ? { locationImg: basePage.locationImg } : {}),
    } as TSellingPageInput;
}

function asStringArray(v: unknown): string[] {
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

/** Map an existing API page to visual form values (edit prefill). */
export function formValuesFromPage(page: TSellingPage): SellingPageFormValues {
    const cards: FormCard[] = Array.isArray(page.cards)
        ? (page.cards as any[]).map((c) => ({
            title: String(c?.title ?? ""),
            description: String(c?.description ?? ""),
            image: String(c?.image ?? ""),
        }))
        : [];

    const steps: FormStep[] = Array.isArray(page.steps)
        ? (page.steps as any[]).map((s) => ({
            step: String(s?.step ?? ""),
            title: String(s?.title ?? ""),
            descriptionText: Array.isArray(s?.description)
                ? (s.description as any[]).join("\n")
                : String(s?.description ?? ""),
            icon: String(s?.icon ?? ""),
        }))
        : [];

    const chips: string[] = Array.isArray(page.locationChips)
        ? (page.locationChips as any[]).map((c) =>
            typeof c === "string" ? c : String(c?.text ?? ""),
        )
        : [];

    return {
        name: page.name ?? "",
        slug: page.slug ?? "",
        variant: (["left", "center", "right"].includes(page.variant)
            ? page.variant
            : "left") as SellingPageFormValues["variant"],
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
        offerFeatures: asStringArray(page.offerFeatures),
        cards,
        steps,
        chips,
    };
}

/** Build a TSellingPage-shaped object from form values for live preview. The
 * provided `base` supplies media fields (uploaded separately) + ids. */
export function formValuesToApiPage(
    values: SellingPageFormValues,
    base?: Partial<TSellingPage>,
): TSellingPage {
    const payload = buildSellingPagePayload(values, base);
    return {
        ...(base as TSellingPage),
        ...(payload as unknown as TSellingPage),
    };
}
