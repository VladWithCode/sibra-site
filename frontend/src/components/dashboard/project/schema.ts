import type { TProject, TProjectInput, TProjectAppealItem, TProjectSection } from "@/queries/type";
import z from "zod";

const requiredNumber = z
    .number({ error: "Valor numérico requerido" })
    .min(0, "El valor no puede ser negativo");

const requiredInt = z
    .number({ error: "Valor numérico requerido" })
    .int("Debe ser un número entero")
    .min(0, "El valor no puede ser negativo");

const optionalNumber = z.number().optional();

export const ProjectAmenityInputSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "El nombre es obligatorio"),
    icon: z.string().min(1, "El ícono es obligatorio"),
    file: z.instanceof(File).optional(),
});

export const ProjectDocInputSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "El nombre del documento es obligatorio"),
    description: z.string(),
    file: z.instanceof(File, { error: "El archivo es obligatorio" }),
});

export const ProjectAppealItemInputSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string(),
});

// ProjectSectionInputSchema models a single section row in the admin form.
// imageFile is local-only state (pending upload). After upload, the returned
// filename is stored in `image`, and imageFile is cleared.
//
// Validation rule (body or image or imageFile required) is enforced at submit
// time via `isSectionValid` and on the server via db.ErrProjectSectionEmpty.
// Keeping this schema as a plain ZodObject (no `.refine`) preserves the
// StandardSchemaV1 array inference used by @tanstack/react-form.
export const ProjectSectionInputSchema = z.object({
    id: z.string().optional(),
    title: z.string().max(200, "Máximo 200 caracteres"),
    body: z.string(),
    image: z.string(),
    imageFile: z.instanceof(File).optional(),
    image_side: z.enum(["left", "right"]),
});

export function isSectionValid(s: { body: string; image: string; imageFile?: File }): boolean {
    return s.body.trim() !== "" || s.image.trim() !== "" || s.imageFile !== undefined;
}

export const ProjectFormSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    quote: z.string(),
    summary: z.string(),
    location: z.string().min(1, "La ubicación es obligatoria"),

    total_area: requiredNumber,
    lot_count: requiredInt,
    available_lots: requiredInt,

    lat: optionalNumber,
    lon: optionalNumber,

    mainImg: z.instanceof(File).optional(),
    availabilityImg: z.instanceof(File).optional(),
    quoteImg: z.instanceof(File).optional(),
    gallery: z.array(z.instanceof(File)),

    amenities: z.array(ProjectAmenityInputSchema),
    docs: z.array(ProjectDocInputSchema),
    appeal_list: z.array(ProjectAppealItemInputSchema),
    sections: z.array(ProjectSectionInputSchema),
});

export type ProjectFormValues = z.infer<typeof ProjectFormSchema>;
export type ProjectSectionFormValue = z.infer<typeof ProjectSectionInputSchema>;

export const projectFormDefaults: ProjectFormValues = {
    name: "",
    quote: "",
    summary: "",
    location: "",
    total_area: 0,
    lot_count: 0,
    available_lots: 0,
    lat: undefined,
    lon: undefined,
    mainImg: undefined,
    availabilityImg: undefined,
    quoteImg: undefined,
    gallery: [],
    amenities: [],
    docs: [],
    appeal_list: [],
    sections: [],
};

export function buildProjectPayload(v: ProjectFormValues): TProjectInput {
    const payload: TProjectInput = {
        name: v.name,
        quote: v.quote,
        summary: v.summary,
        location: v.location,
        total_area: v.total_area,
        lot_count: v.lot_count,
        available_lots: v.available_lots,
        appeal_list: v.appeal_list.map((a) => ({
            id: a.id ?? "",
            name: a.name,
            description: a.description,
        })) as TProjectAppealItem[],
        // Sections are serialized without imageFile (local-only). image must
        // already contain the uploaded filename by the time the form submits.
        sections: v.sections.map((s, i) => ({
            id: s.id ?? "",
            position: i,
            title: s.title,
            body: s.body,
            image: s.image,
            image_side: s.image_side,
        })) as TProjectSection[],
    };
    if (typeof v.lat === "number") payload.lat = v.lat;
    if (typeof v.lon === "number") payload.lon = v.lon;
    return payload;
}

export function projectToFormValues(p: TProject): ProjectFormValues {
    return {
        name: p.name ?? "",
        quote: p.quote ?? "",
        summary: p.summary ?? "",
        location: p.location ?? "",
        total_area: p.total_area ?? 0,
        lot_count: p.lot_count ?? 0,
        available_lots: p.available_lots ?? 0,
        lat: p.lat || undefined,
        lon: p.lon || undefined,
        mainImg: undefined,
        availabilityImg: undefined,
        quoteImg: undefined,
        gallery: [],
        amenities: [],
        docs: [],
        appeal_list: (p.appeal_list ?? []).map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description,
        })),
        sections: (p.sections ?? []).map((s) => ({
            id: s.id,
            title: s.title ?? "",
            body: s.body ?? "",
            image: s.image ?? "",
            imageFile: undefined,
            image_side: (s.image_side === "left" ? "left" : "right") as "left" | "right",
        })),
    };
}
