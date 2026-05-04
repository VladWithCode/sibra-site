import type { TUser } from "@/queries/type";
import z from "zod";

export const ProfileFormSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    email: z.string().email("El email no es válido"),
    phone: z.string().optional().or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

export function userToProfileValues(u: TUser | undefined): ProfileFormValues {
    return {
        name: u?.name ?? "",
        email: u?.email ?? "",
        phone: u?.phone ?? "",
    };
}

export function buildProfilePayload(v: ProfileFormValues) {
    return {
        name: v.name,
        email: v.email,
        phone: v.phone || "",
    };
}

export const PasswordFormSchema = z
    .object({
        currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
        password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
        confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
    })
    .refine((v) => v.password === v.confirmPassword, {
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden",
    });

export type PasswordFormValues = z.infer<typeof PasswordFormSchema>;

export const passwordFormDefaults: PasswordFormValues = {
    currentPassword: "",
    password: "",
    confirmPassword: "",
};
