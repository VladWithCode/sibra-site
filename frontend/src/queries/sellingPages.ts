import { queryOptions, type QueryFunctionContext } from "@tanstack/react-query";
import type { TSellingPageResult, TSellingPagesListResult } from "./type";

export const SellingPageQueryKeys = {
    all: () => ["sellingPages"] as const,
    listing: () => [...SellingPageQueryKeys.all(), "listing"] as const,
    detail: () => [...SellingPageQueryKeys.all(), "detail"] as const,
    bySlug: (slug: string) => [...SellingPageQueryKeys.detail(), "bySlug", { slug }] as const,
} as const;

export type QKSellingPagesListing = ReturnType<typeof SellingPageQueryKeys.listing>;
export type QKSellingPageBySlug = ReturnType<typeof SellingPageQueryKeys.bySlug>;

export const getSellingPageBySlugOpts = (slug: string) =>
    queryOptions({
        queryKey: SellingPageQueryKeys.bySlug(slug),
        queryFn: getSellingPageBySlug,
    });

// Admin listing (editor-gated on the backend). Kept here for Phase 2C admin UI;
// there is no public list endpoint yet.
export const listSellingPagesOpts = () =>
    queryOptions({
        queryKey: SellingPageQueryKeys.listing(),
        queryFn: listSellingPages,
    });

export async function getSellingPageBySlug({
    queryKey,
}: QueryFunctionContext<QKSellingPageBySlug>): Promise<TSellingPageResult> {
    const { slug } = queryKey[3];
    const response = await fetch(`/api/terrenos/public/${slug}`);
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "No se encontró la página solicitada");
    }

    return data;
}

export async function listSellingPages(): Promise<TSellingPagesListResult> {
    const response = await fetch("/api/terrenos");
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Error al obtener las páginas");
    }

    return data;
}
