import type { TUserDetail } from "@/queries/type";
import z from "zod";

const USER_ROLES = ["admin", "editor", "user"] as const;

export const USER_ROLE_LABELS: Record<(typeof USER_ROLES)[number], string> = {
    admin: "Administrador",
    editor: "Agente",
    user: "Usuario",
};

export const UserFormSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    username: z.string().min(1, "El nombre de usuario es obligatorio"),
    email: z.string().email("El email no es válido"),
    phone: z.string().optional().or(z.literal("")),
    role: z.enum(USER_ROLES, { error: "Elige un rol" }),
    password: z.string().optional().or(z.literal("")),
});

export const UserCreateFormSchema = UserFormSchema.extend({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type UserFormValues = z.infer<typeof UserFormSchema>;

export const userFormDefaults: UserFormValues = {
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "user",
    password: "",
};

export function buildUserPayload(v: UserFormValues): Record<string, unknown> {
    const payload: Record<string, unknown> = {
        name: v.name,
        username: v.username,
        email: v.email,
        phone: v.phone || "",
        role: v.role,
    };
    if (v.password && v.password.length > 0) {
        payload.password = v.password;
    }
    return payload;
}

export function userToFormValues(u: TUserDetail): UserFormValues {
    return {
        name: u.name ?? "",
        username: u.username ?? "",
        email: u.email ?? "",
        phone: u.phone ?? "",
        role: u.role ?? "user",
        password: "",
    };
}

export { USER_ROLES };
