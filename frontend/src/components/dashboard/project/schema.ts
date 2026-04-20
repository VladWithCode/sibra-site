import type { TProject, TProjectInput, TProjectAppealItem } from "@/queries/type";
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

export const ProjectFormSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string(),
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
    gallery: z.array(z.instanceof(File)),

    amenities: z.array(ProjectAmenityInputSchema),
    docs: z.array(ProjectDocInputSchema),
    appeal_list: z.array(ProjectAppealItemInputSchema),
});

export type ProjectFormValues = z.infer<typeof ProjectFormSchema>;

export const projectFormDefaults: ProjectFormValues = {
    name: "",
    description: "",
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
    gallery: [],
    amenities: [],
    docs: [],
    appeal_list: [],
};

export function buildProjectPayload(v: ProjectFormValues): TProjectInput {
    const payload: TProjectInput = {
        name: v.name,
        description: v.description,
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
    };
    if (typeof v.lat === "number") payload.lat = v.lat;
    if (typeof v.lon === "number") payload.lon = v.lon;
    return payload;
}

export function projectToFormValues(p: TProject): ProjectFormValues {
    return {
        name: p.name ?? "",
        description: p.description ?? "",
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
        gallery: [],
        amenities: [],
        docs: [],
        appeal_list: (p.appeal_list ?? []).map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description,
        })),
    };
}
