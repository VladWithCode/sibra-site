import { mutationOptions, queryOptions } from "@tanstack/react-query";
import type { TLogin, TLoginResult, TUserProfileResult } from "./type";

export const AuthQueryKeys = {
    all: () => ["auth"] as const,
    login: () => [...AuthQueryKeys.all(), "login"] as const,
    logout: () => [...AuthQueryKeys.all(), "logout"] as const,
    profile: () => [...AuthQueryKeys.all(), "profile"] as const,
} as const;

export type QKAuthLogin = ReturnType<typeof AuthQueryKeys.login>;
export type QKAuthLogout = ReturnType<typeof AuthQueryKeys.logout>;
export type QKAuthProfile = ReturnType<typeof AuthQueryKeys.profile>;

export const getLoginOpts = mutationOptions({
    mutationKey: AuthQueryKeys.login(),
    mutationFn: login,
})

export const getProfileOpts = queryOptions({
    queryKey: AuthQueryKeys.profile(),
    queryFn: getProfile,
});

export const logoutOpts = queryOptions({
    queryKey: AuthQueryKeys.logout(),
    queryFn: logout,
});

export async function getProfile(): Promise<TUserProfileResult> {
    const res = await fetch("/api/perfil");
    const data = await res.json();

    if (res.status < 200 || res.status >= 300) {
        throw new Error(data.error || "Error al obtener la información del perfil");
    }

    return data;
}

export async function login(login: TLogin): Promise<TLoginResult> {
    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(login),
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Error al procesar la solicitud");
    }

    return data;
}

export async function logout(): Promise<void> {
    const response = await fetch("/api/auth/logout", {
        method: "POST",
    });

    if (response.status < 200 || response.status >= 300) {
        const data = await response.json();
        throw new Error(data.error || "Error al cerrar la sesión");
    }
}


