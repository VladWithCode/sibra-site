import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient } from "./queryClient";

/**
 * Featured section content: admin-curated cards on the home page. Each card
 * links to an internal resource (resolved live by the backend) or an external
 * URL with its own title/image.
 *
 * FEATURED_KINDS is the frontend side of the kind registry. To support a new
 * linkable resource kind, register a resolver in the backend
 * (internal/db/featured.go) and add an entry here (plus a picker in the panel
 * page's add/edit dialog).
 */
export const FEATURED_KINDS = [
    { value: "property", label: "Propiedad" },
    { value: "project", label: "Proyecto" },
    { value: "selling_page", label: "Página de venta" },
    { value: "blog_post", label: "Artículo del blog" },
    { value: "external", label: "Enlace externo" },
] as const;

export type TFeaturedKind = (typeof FEATURED_KINDS)[number]["value"];

export function featuredKindLabel(kind: string): string {
    return FEATURED_KINDS.find((k) => k.value === kind)?.label ?? kind;
}

/** Raw stored item, as edited in the panel. */
export type TFeaturedItem = {
    id: string;
    kind: TFeaturedKind;
    resourceId: string;
    externalUrl: string;
    title: string;
    image: string;
    subtitle: string;
    position: number;
    createdAt: string;
    updatedAt: string;
};

/** Render-ready card: resource data merged with per-item overrides. */
export type TResolvedFeaturedItem = {
    id: string;
    kind: TFeaturedKind;
    position: number;
    title: string;
    subtitle: string;
    image: string;
    href: string;
    external: boolean;
    meta?: {
        price?: number;
        contract?: string;
        beds?: number;
        baths?: number;
        sqMt?: number;
    };
};

export type TFeaturedContent = {
    items: TResolvedFeaturedItem[];
    visibleCount: number;
};

export type TAdminFeaturedContent = {
    items: TFeaturedItem[];
    resolved: TResolvedFeaturedItem[];
    visibleCount: number;
};

export type TFeaturedItemInput = {
    kind: TFeaturedKind;
    resourceId?: string;
    externalUrl?: string;
    title?: string;
    image?: string;
    subtitle?: string;
};

export const FeaturedQueryKeys = {
    all: () => ["featured"] as const,
    content: () => [...FeaturedQueryKeys.all(), "content"] as const,
    admin: () => [...FeaturedQueryKeys.all(), "admin"] as const,
} as const;

export const getFeaturedContentOpts = queryOptions({
    queryKey: FeaturedQueryKeys.content(),
    queryFn: getFeaturedContent,
});

export const getAdminFeaturedContentOpts = queryOptions({
    queryKey: FeaturedQueryKeys.admin(),
    queryFn: getAdminFeaturedContent,
});

function invalidateFeatured() {
    queryClient.invalidateQueries({ queryKey: FeaturedQueryKeys.all() });
}

export const createFeaturedItemOpts = () =>
    mutationOptions({
        mutationKey: [...FeaturedQueryKeys.all(), "create"],
        mutationFn: (input: TFeaturedItemInput) => createFeaturedItem(input),
        onSuccess: invalidateFeatured,
    });

export const updateFeaturedItemOpts = (id: string) =>
    mutationOptions({
        mutationKey: [...FeaturedQueryKeys.all(), "update", { id }],
        mutationFn: (input: TFeaturedItemInput) => updateFeaturedItem(id, input),
        onSuccess: invalidateFeatured,
    });

export const deleteFeaturedItemOpts = () =>
    mutationOptions({
        mutationKey: [...FeaturedQueryKeys.all(), "delete"],
        mutationFn: (id: string) => deleteFeaturedItem(id),
        onSuccess: invalidateFeatured,
    });

export const reorderFeaturedItemsOpts = () =>
    mutationOptions({
        mutationKey: [...FeaturedQueryKeys.all(), "reorder"],
        mutationFn: (ids: string[]) => reorderFeaturedItems(ids),
        onSuccess: invalidateFeatured,
    });

export const updateFeaturedConfigOpts = () =>
    mutationOptions({
        mutationKey: [...FeaturedQueryKeys.all(), "config"],
        mutationFn: (visibleCount: number) => updateFeaturedConfig(visibleCount),
        onSuccess: invalidateFeatured,
    });

export const uploadFeaturedImageOpts = () =>
    mutationOptions({
        mutationKey: [...FeaturedQueryKeys.all(), "image", "upload"],
        mutationFn: (file: File) => uploadFeaturedImage(file),
    });

// ---- Fetchers ----

async function jsonFetch<T>(url: string, init: RequestInit, fallbackMsg: string): Promise<T> {
    const response = await fetch(url, init);
    const data = await response.json();
    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || data.message || fallbackMsg);
    }
    return data as T;
}

export async function getFeaturedContent(): Promise<TFeaturedContent> {
    return jsonFetch<TFeaturedContent>(
        "/api/destacados",
        {},
        "Error al obtener el contenido destacado",
    );
}

export async function getAdminFeaturedContent(): Promise<TAdminFeaturedContent> {
    return jsonFetch<TAdminFeaturedContent>(
        "/api/admin/destacados",
        {},
        "Error al obtener el contenido destacado",
    );
}

export async function createFeaturedItem(
    input: TFeaturedItemInput,
): Promise<{ success: boolean; item: TFeaturedItem }> {
    return jsonFetch(
        "/api/admin/destacados",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        },
        "No se pudo crear el destacado",
    );
}

export async function updateFeaturedItem(
    id: string,
    input: TFeaturedItemInput,
): Promise<{ success: boolean; item: TFeaturedItem }> {
    return jsonFetch(
        `/api/admin/destacados/${id}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        },
        "No se pudo actualizar el destacado",
    );
}

export async function deleteFeaturedItem(id: string): Promise<{ success: boolean }> {
    return jsonFetch(
        `/api/admin/destacados/${id}`,
        { method: "DELETE" },
        "No se pudo eliminar el destacado",
    );
}

export async function reorderFeaturedItems(ids: string[]): Promise<{ success: boolean }> {
    return jsonFetch(
        "/api/admin/destacados/orden",
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
        },
        "No se pudo reordenar el contenido destacado",
    );
}

export async function updateFeaturedConfig(
    visibleCount: number,
): Promise<{ success: boolean; visibleCount: number }> {
    return jsonFetch(
        "/api/admin/destacados/config",
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visibleCount }),
        },
        "No se pudo actualizar la configuración",
    );
}

export async function uploadFeaturedImage(
    file: File,
): Promise<{ success: boolean; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return jsonFetch(
        "/api/admin/destacados/imagen",
        { method: "POST", body: formData },
        "No se pudo subir la imagen",
    );
}

/** Turns a stored image value (bare upload filename or absolute path/URL)
 * into a displayable src. */
export function featuredImageSrc(image: string): string | undefined {
    if (!image) return undefined;
    if (image.startsWith("/") || image.startsWith("http")) return image;
    return `/static/uploads/${image}`;
}
