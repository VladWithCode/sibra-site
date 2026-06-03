import {
    mutationOptions,
    queryOptions,
    type QueryFunctionContext,
} from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import type { TSellingPage, TSellingPageResult, TSellingPagesListResult } from "./type";

export const SellingPageQueryKeys = {
    all: () => ["sellingPages"] as const,
    listing: () => [...SellingPageQueryKeys.all(), "listing"] as const,
    detail: () => [...SellingPageQueryKeys.all(), "detail"] as const,
    bySlug: (slug: string) => [...SellingPageQueryKeys.detail(), "bySlug", { slug }] as const,
    byId: (id: string) => [...SellingPageQueryKeys.detail(), "byId", { id }] as const,
} as const;

export type QKSellingPagesListing = ReturnType<typeof SellingPageQueryKeys.listing>;
export type QKSellingPageBySlug = ReturnType<typeof SellingPageQueryKeys.bySlug>;
export type QKSellingPageById = ReturnType<typeof SellingPageQueryKeys.byId>;

// Input for create/update. All fields optional except name/slug/variant which
// the backend validates; empty fields fall back to defaults at render time.
export type TSellingPageInput = Partial<TSellingPage> & {
    name: string;
    slug: string;
    variant: string;
};

export type TUploadSellingPageMediaInput = {
    id: string;
    field: string;
    file: File;
};

// ---- Query options ----

export const getSellingPageBySlugOpts = (slug: string) =>
    queryOptions({
        queryKey: SellingPageQueryKeys.bySlug(slug),
        queryFn: getSellingPageBySlug,
    });

export const getSellingPageByIdOpts = (id: string) =>
    queryOptions({
        queryKey: SellingPageQueryKeys.byId(id),
        queryFn: getSellingPageById,
    });

export const listSellingPagesOpts = () =>
    queryOptions({
        queryKey: SellingPageQueryKeys.listing(),
        queryFn: listSellingPages,
    });

// ---- Mutation options ----

export const createSellingPageOpts = () =>
    mutationOptions({
        mutationKey: [...SellingPageQueryKeys.all(), "create"],
        mutationFn: (input: TSellingPageInput) => createSellingPage(input),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: SellingPageQueryKeys.listing(),
            });
        },
    });

export const updateSellingPageOpts = (id: string) =>
    mutationOptions({
        mutationKey: [...SellingPageQueryKeys.all(), "update", { id }],
        mutationFn: (input: TSellingPageInput) => updateSellingPage(id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: SellingPageQueryKeys.byId(id),
            });
            queryClient.invalidateQueries({
                queryKey: SellingPageQueryKeys.listing(),
            });
        },
    });

export const deleteSellingPageOpts = (id: string) =>
    mutationOptions({
        mutationKey: [...SellingPageQueryKeys.all(), "delete", { id }],
        mutationFn: () => deleteSellingPage(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: SellingPageQueryKeys.listing(),
            });
        },
    });

export const setSellingPagePublishedOpts = (id: string) =>
    mutationOptions({
        mutationKey: [...SellingPageQueryKeys.all(), "publish", { id }],
        mutationFn: (published: boolean) => setSellingPagePublished(id, published),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: SellingPageQueryKeys.byId(id),
            });
            queryClient.invalidateQueries({
                queryKey: SellingPageQueryKeys.listing(),
            });
        },
    });

export const uploadSellingPageMediaOpts = (id: string) =>
    mutationOptions({
        mutationKey: [...SellingPageQueryKeys.all(), "media", "upload", { id }],
        mutationFn: uploadSellingPageMedia,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: SellingPageQueryKeys.byId(id),
            });
        },
    });

export const removeSellingPageMediaOpts = (id: string) =>
    mutationOptions({
        mutationKey: [...SellingPageQueryKeys.all(), "media", "remove", { id }],
        mutationFn: (field: string) => removeSellingPageMedia(id, field),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: SellingPageQueryKeys.byId(id),
            });
        },
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

export async function getSellingPageBySlug({
    queryKey,
}: QueryFunctionContext<QKSellingPageBySlug>): Promise<TSellingPageResult> {
    const { slug } = queryKey[3];
    return jsonFetch<TSellingPageResult>(
        `/api/terrenos/public/${slug}`,
        {},
        "No se encontró la página solicitada",
    );
}

export async function getSellingPageById({
    queryKey,
}: QueryFunctionContext<QKSellingPageById>): Promise<TSellingPageResult> {
    const { id } = queryKey[3];
    return jsonFetch<TSellingPageResult>(`/api/terrenos/${id}`, {}, "No se encontró la página");
}

export async function listSellingPages(): Promise<TSellingPagesListResult> {
    return jsonFetch<TSellingPagesListResult>(
        "/api/terrenos",
        {},
        "Error al obtener las páginas",
    );
}

export async function createSellingPage(input: TSellingPageInput): Promise<TSellingPageResult> {
    return jsonFetch<TSellingPageResult>(
        "/api/terrenos",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        },
        "Error al crear la página",
    );
}

export async function updateSellingPage(
    id: string,
    input: TSellingPageInput,
): Promise<TSellingPageResult> {
    return jsonFetch<TSellingPageResult>(
        `/api/terrenos/${id}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
        },
        "Error al actualizar la página",
    );
}

export async function deleteSellingPage(id: string): Promise<{ success: boolean }> {
    return jsonFetch<{ success: boolean }>(
        `/api/terrenos/${id}`,
        { method: "DELETE" },
        "Error al eliminar la página",
    );
}

export async function setSellingPagePublished(
    id: string,
    published: boolean,
): Promise<{ success: boolean }> {
    return jsonFetch<{ success: boolean }>(
        `/api/terrenos/${id}/published`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ published }),
        },
        "Error al cambiar el estado",
    );
}

export async function uploadSellingPageMedia({
    id,
    field,
    file,
}: TUploadSellingPageMediaInput): Promise<{
    success: boolean;
    field: string;
    filename: string;
}> {
    const fd = new FormData();
    fd.append("file", file);
    return jsonFetch(
        `/api/terrenos/${id}/medios/${field}`,
        { method: "PUT", body: fd },
        "Error al subir el archivo",
    );
}

export async function removeSellingPageMedia(
    id: string,
    field: string,
): Promise<{ success: boolean; field: string }> {
    return jsonFetch(
        `/api/terrenos/${id}/medios/${field}`,
        { method: "DELETE" },
        "Error al eliminar el archivo",
    );
}
