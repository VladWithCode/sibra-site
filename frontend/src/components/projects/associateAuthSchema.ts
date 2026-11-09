import z from "zod";

// Lives outside the route file: TanStack's code splitter leaves top-level
// declarations in the eagerly loaded route module, and zod schema calls are
// not tree-shaken, so declaring it there ships classic zod in the entry chunk.
export const AssociateAuthenticationSchema = z.object({
    projectId: z.string({ error: "El ID del proyecto es obligatorio" }),
    idcode: z
        .string({ error: "Debes ingresar un RFC o CURP" })
        .or(
            z
                .string()
                .min(18, "La CURP ingresada es demasiado corta")
                .max(18, "La CURP ingresada es demasiado larga"),
        )
        .or(
            z
                .string()
                .min(13, "El número de lote es demasiado corto")
                .max(13, "El número de lote es demasiado largo"),
        ),
    lotNum: z
        .string({ error: "El número de lote es obligatorio" })
        .min(1, "El número de lote es obligatorio"),
    appleNum: z
        .string({ error: "El número de manzana es obligatorio" })
        .min(1, "El número de manzana es obligatorio"),
});

export type authAssociatesFormType = z.infer<typeof AssociateAuthenticationSchema>;
