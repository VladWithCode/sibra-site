import type { TQuote } from "@/queries/type";
import { z } from "zod";

export const QUOTE_TYPES = [
    "informacion",
    "cita",
    "venta",
    "precalificacion",
    "proyecto",
] as const;

export const QUOTE_PROP_TYPES = ["proyecto", "propiedad", "general"] as const;

export const QUOTE_STATUSES = [
    "pendiente",
    "atendida",
    "confirmada",
    "volver a atender",
] as const;

export const QUOTE_TYPE_LABELS: Record<(typeof QUOTE_TYPES)[number], string> = {
    informacion: "Información",
    cita: "Cita",
    venta: "Venta",
    precalificacion: "Precalificación",
    proyecto: "Proyecto",
};

export const QUOTE_PROP_TYPE_LABELS: Record<
    (typeof QUOTE_PROP_TYPES)[number],
    string
> = {
    proyecto: "Proyecto",
    propiedad: "Propiedad",
    general: "General",
};

export const QUOTE_STATUS_LABELS: Record<
    (typeof QUOTE_STATUSES)[number],
    string
> = {
    pendiente: "Pendiente",
    atendida: "Atendida",
    confirmada: "Confirmada",
    "volver a atender": "Volver a atender",
};

export const QuoteFormSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    phone: z.string().min(1, "El teléfono es obligatorio"),
    type: z.enum(QUOTE_TYPES, { error: "Selecciona un tipo de solicitud" }),
    propType: z.enum(QUOTE_PROP_TYPES, {
        error: "Selecciona un tipo de propiedad",
    }),
    status: z.enum(QUOTE_STATUSES, { error: "Selecciona un estatus" }),
    scheduledDate: z.string(),
    agent: z.string(),
    property: z.string(),
    project: z.string(),
});

export type QuoteFormValues = z.infer<typeof QuoteFormSchema>;

const ZERO_DATE = "0001-01-01T00:00:00Z";

export function quoteToFormValues(q: TQuote): QuoteFormValues {
    return {
        name: q.name ?? "",
        phone: q.phone ?? "",
        type: q.type ?? "informacion",
        propType: q.propType ?? "general",
        status: q.status ?? "pendiente",
        scheduledDate:
            q.scheduledDate && q.scheduledDate !== ZERO_DATE
                ? q.scheduledDate.slice(0, 16)
                : "",
        agent: q.agent ?? "",
        property: q.property ?? "",
        project: q.project ?? "",
    };
}

export function buildQuotePayload(v: QuoteFormValues): Partial<TQuote> {
    return {
        name: v.name,
        phone: v.phone,
        type: v.type,
        propType: v.propType,
        status: v.status,
        scheduledDate: v.scheduledDate,
        agent: v.agent,
        property: v.property,
        project: v.project,
    };
}
