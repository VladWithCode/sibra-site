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

export const PropertyFormSchema = z.object({
    address: z.string().min(1, "La dirección es obligatoria"),
    nbHood: z.string(),
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

    featured: z.boolean(),

    features: z.array(FeatureInputSchema),
    amenities: z.array(AmenityInputSchema),

    mainImg: z.instanceof(File).optional(),
    gallery: z.array(z.instanceof(File)),
});

export type PropertyFormValues = z.infer<typeof PropertyFormSchema>;

export const propertyFormDefaults: PropertyFormValues = {
    address: "",
    nbHood: "",
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
    featured: false,
    features: [],
    amenities: [],
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
