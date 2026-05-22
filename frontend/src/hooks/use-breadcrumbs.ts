import { useMatches } from "@tanstack/react-router";

export type BreadcrumbItem = {
    label: string;
    to?: string;
    params?: Record<string, string>;
    isCurrent: boolean;
};

const BREADCRUMB_CONFIG: Record<
    string,
    {
        label?: string;
        dynamicKey?: string;
        skip?: boolean;
        parent?: { label: string; to: string };
    }
> = {
    "/panel": { label: "Panel" },
    "/panel/": { skip: true },

    "/panel/propiedades": { label: "Propiedades" },
    "/panel/propiedades/$id": {
        dynamicKey: "propertyTitle",
        parent: { label: "Propiedades", to: "/panel/propiedades" },
    },
    "/panel/propiedades/nueva": {
        label: "Nueva propiedad",
        parent: { label: "Propiedades", to: "/panel/propiedades" },
    },

    "/panel/proyectos": { label: "Proyectos" },
    "/panel/proyectos/nuevo": {
        label: "Nuevo proyecto",
        parent: { label: "Proyectos", to: "/panel/proyectos" },
    },
    "/panel/proyectos/$id": {
        dynamicKey: "projectName",
        parent: { label: "Proyectos", to: "/panel/proyectos" },
    },
    "/panel/proyectos/$id/": { skip: true },
    "/panel/proyectos/$id/asociados": { label: "Asociados" },
    "/panel/proyectos/$id/asociados/": { skip: true },
    "/panel/proyectos/$id/asociados/nuevo": {
        label: "Nuevo asociado",
        parent: { label: "Asociados", to: "/panel/proyectos/$id/asociados" },
    },
    "/panel/proyectos/$id/asociados/vincular": {
        label: "Vincular asociado",
        parent: { label: "Asociados", to: "/panel/proyectos/$id/asociados" },
    },
    "/panel/proyectos/$id/asociados/$associateId": {
        dynamicKey: "associateName",
        parent: { label: "Asociados", to: "/panel/proyectos/$id/asociados" },
    },

    "/panel/citas": { label: "Citas y contacto" },
    "/panel/citas/$id": {
        dynamicKey: "clientName",
        parent: { label: "Citas y contacto", to: "/panel/citas" },
    },

    "/panel/asociados/": { label: "Asociados" },

    "/panel/usuarios": { label: "Usuarios" },
    "/panel/usuarios/nuevo": {
        label: "Nuevo usuario",
        parent: { label: "Usuarios", to: "/panel/usuarios" },
    },
    "/panel/usuarios/$id": {
        dynamicKey: "userName",
        parent: { label: "Usuarios", to: "/panel/usuarios" },
    },

    "/panel/equipo": { label: "Equipo" },
    "/panel/equipo/nuevo": {
        label: "Nuevo miembro",
        parent: { label: "Equipo", to: "/panel/equipo" },
    },
    "/panel/equipo/$id": {
        dynamicKey: "memberName",
        parent: { label: "Equipo", to: "/panel/equipo" },
    },

    "/panel/blog": { label: "Blog" },
    "/panel/blog/nuevo": {
        label: "Nuevo post",
        parent: { label: "Blog", to: "/panel/blog" },
    },
    "/panel/blog/$id": {
        dynamicKey: "postTitle",
        parent: { label: "Blog", to: "/panel/blog" },
    },

    "/panel/perfil/": { label: "Mi perfil" },
    "/panel/perfil/editar": {
        label: "Editar perfil",
        parent: { label: "Mi perfil", to: "/panel/perfil" },
    },
    "/panel/perfil/contrasena": {
        label: "Cambiar contraseña",
        parent: { label: "Mi perfil", to: "/panel/perfil" },
    },

    "/panel/analiticas/": { label: "Analíticas" },
};

export function useBreadcrumbs(): BreadcrumbItem[] {
    const matches = useMatches();
    const items: BreadcrumbItem[] = [];

    const allParams: Record<string, string> = {};
    for (const match of matches) {
        Object.assign(allParams, match.params);
    }

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        if (match.routeId === "__root__") continue;

        const config = BREADCRUMB_CONFIG[match.routeId];

        if (config?.skip) continue;

        if (config?.parent) {
            items.push({
                label: config.parent.label,
                to: config.parent.to,
                params: allParams,
                isCurrent: false,
            });
        }

        let label = config?.label;
        if (config?.dynamicKey && match.loaderData) {
            label =
                (match.loaderData as Record<string, string>)[config.dynamicKey] ??
                label;
        }

        if (!label) {
            const segments = match.pathname.split("/").filter(Boolean);
            label = segments[segments.length - 1] || "Panel";
        }

        const isCurrent = i === matches.length - 1;

        items.push({
            label,
            to: isCurrent ? undefined : match.routeId,
            params: isCurrent ? undefined : allParams,
            isCurrent,
        });
    }

    return items;
}
