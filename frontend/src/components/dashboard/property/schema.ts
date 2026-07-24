import type { TProperty } from "@/queries/type";
import z from "zod";

const PROPERTY_STATUSES = [
    "borrador",
    "en_revision",
    "publicada",
    "archivada",
    "vendida",
    "no_disponible",
] as const;

const PROPERTY_TYPES = ["casa", "apartamento", "terreno"] as const;
const PROPERTY_CONTRACTS = ["venta", "renta"] as const;

const requiredNumber = z
    .number({ error: "Valor numérico requerido" })
    .min(0, "El valor no puede ser negativo");

const requiredInt = z
    .number({ error: "Valor numérico requerido" })
    .int("Debe ser un número entero")
    .min(0, "El valor no puede ser negativo");

const optionalNumber = z.number().optional();

export const FeatureInputSchema = z.object({
    id: z.string().optional(),
    icon: z.string().min(1, "El ícono es obligatorio"),
    title: z.string().min(1, "El título es obligatorio"),
    description: z.string(),
});

export const AmenityInputSchema = z.object({
    id: z.string().optional(),
    icon: z.string().min(1, "El ícono es obligatorio"),
    title: z.string().min(1, "El título es obligatorio"),
});

export const DETAIL_CATEGORIES = ["interior", "exterior"] as const;

export const DetailInputSchema = z.object({
    id: z.string().optional(),
    category: z.enum(DETAIL_CATEGORIES),
    icon: z.string(),
    name: z.string().min(1, "El nombre es obligatorio"),
    value: z.string(),
    position: z.number(),
});

export const NamedImageInputSchema = z.object({
    id: z.string().optional(),
    category: z.enum(DETAIL_CATEGORIES),
    image: z.string().min(1, "La imagen es obligatoria"),
    caption: z.string(),
    position: z.number(),
});

export const PropertyFormSchema = z.object({
    title: z.string(),
    address: z.string().min(1, "La dirección es obligatoria"),
    city: z.string().min(1, "La ciudad es obligatoria"),
    state: z.string().min(1, "El estado es obligatorio"),
    zip: z.string(),
    country: z.string(),
    description: z.string(),

    price: requiredNumber,
    propertyType: z.enum(PROPERTY_TYPES, { error: "Elige el tipo de propiedad" }),
    contract: z.enum(PROPERTY_CONTRACTS, { error: "Elige el tipo de contrato" }),
    status: z.enum(PROPERTY_STATUSES),

    beds: requiredInt,
    baths: requiredInt,
    sqMt: requiredNumber,
    lotSize: requiredNumber,
    yearBuilt: optionalNumber,

    lat: optionalNumber,
    lon: optionalNumber,

    features: z.array(FeatureInputSchema),
    amenities: z.array(AmenityInputSchema),
    details: z.array(DetailInputSchema),
    namedImages: z.array(NamedImageInputSchema),

    mainImg: z.instanceof(File).optional(),
    gallery: z.array(z.instanceof(File)),
});

export type PropertyFormValues = z.infer<typeof PropertyFormSchema>;

export const propertyFormDefaults: PropertyFormValues = {
    title: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "México",
    description: "",
    price: 0,
    propertyType: "casa",
    contract: "venta",
    status: "borrador",
    beds: 0,
    baths: 0,
    sqMt: 0,
    lotSize: 0,
    yearBuilt: undefined,
    lat: undefined,
    lon: undefined,
    features: [],
    amenities: [],
    details: [],
    namedImages: [],
    mainImg: undefined,
    gallery: [],
};

export const PROPERTY_STATUS_LABELS: Record<(typeof PROPERTY_STATUSES)[number], string> = {
    borrador: "Borrador",
    en_revision: "En revisión",
    publicada: "Publicada",
    archivada: "Archivada",
    vendida: "Vendida",
    no_disponible: "No disponible",
};

export const PROPERTY_TYPE_LABELS: Record<(typeof PROPERTY_TYPES)[number], string> = {
    casa: "Casa",
    apartamento: "Apartamento",
    terreno: "Terreno",
};

export const PROPERTY_CONTRACT_LABELS: Record<(typeof PROPERTY_CONTRACTS)[number], string> = {
    venta: "Venta",
    renta: "Renta",
};

export { PROPERTY_STATUSES, PROPERTY_TYPES, PROPERTY_CONTRACTS };

export function buildPropertyPayload(v: PropertyFormValues): Partial<TProperty> {
    const payload: Partial<TProperty> = {
        title: v.title,
        address: v.address,
        city: v.city,
        state: v.state,
        zip: v.zip,
        country: v.country,
        description: v.description,
        price: v.price,
        propertyType: v.propertyType,
        contract: v.contract,
        status: v.status,
        beds: v.beds,
        baths: v.baths,
        sqMt: v.sqMt,
        lotSize: v.lotSize,
        features: v.features as TProperty["features"],
        amenities: v.amenities as TProperty["amenities"],
        details: v.details as TProperty["details"],
        namedImages: v.namedImages as TProperty["namedImages"],
    };
    if (typeof v.yearBuilt === "number") payload.yearBuilt = v.yearBuilt;
    if (typeof v.lat === "number") payload.lat = v.lat;
    if (typeof v.lon === "number") payload.lon = v.lon;
    return payload;
}

export function propertyToFormValues(p: TProperty): PropertyFormValues {
    return {
        title: p.title ?? "",
        address: p.address ?? "",
        city: p.city ?? "",
        state: p.state ?? "",
        zip: p.zip ?? "",
        country: p.country ?? "México",
        description: p.description ?? "",
        price: p.price ?? 0,
        propertyType: p.propertyType ?? "casa",
        contract: p.contract ?? "venta",
        status: p.status ?? "borrador",
        beds: p.beds ?? 0,
        baths: p.baths ?? 0,
        sqMt: p.sqMt ?? 0,
        lotSize: p.lotSize ?? 0,
        yearBuilt: p.yearBuilt || undefined,
        lat: p.lat || undefined,
        lon: p.lon || undefined,
        features: p.features ?? [],
        amenities: p.amenities ?? [],
        details: p.details ?? [],
        namedImages: p.namedImages ?? [],
        mainImg: undefined,
        gallery: [],
    };
}
