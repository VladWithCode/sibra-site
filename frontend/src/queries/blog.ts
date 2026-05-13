import { mutationOptions, queryOptions, type QueryFunctionContext } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { objectToQueryString } from "./util";
import type {
    TBlogPostFilters,
    TBlogPostListingResult,
    TBlogPostDetailResult,
    TBlogTagListingResult,
    TBlogPostCreatePayload,
    TBlogPostUpdatePayload,
    TBlogPostStatusPayload,
    TBlogPostCreateResult,
    TBlogPostUpdateResult,
    TBlogPostStatusResult,
    TBlogPostDeleteResult,
    TBlogTagCreateResult,
    TBlogTagDeleteResult,
    TBlogImageUploadResult,
} from "./type";

// ── Query keys ────────────────────────────────────────────────────────────────

export const BlogQueryKeys = {
    all: () => ["blog"] as const,
    posts: () => [...BlogQueryKeys.all(), "posts"] as const,
    postListing: (filters: Partial<TBlogPostFilters>) =>
        [...BlogQueryKeys.posts(), "listing", { filters }] as const,
    postById: (id: string) => [...BlogQueryKeys.posts(), "byId", { id }] as const,
    publicListing: (filters: { page?: number; limit?: number }) =>
        [...BlogQueryKeys.posts(), "public-listing", { filters }] as const,
    publicBySlug: (slug: string) =>
        [...BlogQueryKeys.posts(), "public-by-slug", { slug }] as const,
    tags: () => [...BlogQueryKeys.all(), "tags"] as const,
} as const;

export type QKBlogPostListing = ReturnType<typeof BlogQueryKeys.postListing>;
export type QKBlogPostById = ReturnType<typeof BlogQueryKeys.postById>;
export type QKPublicBlogPostListing = ReturnType<typeof BlogQueryKeys.publicListing>;
export type QKPublicBlogPostBySlug = ReturnType<typeof BlogQueryKeys.publicBySlug>;

// ── Query options ─────────────────────────────────────────────────────────────

export const getAdminBlogPostsOpts = (filters: Partial<TBlogPostFilters>) =>
    queryOptions({
        queryKey: BlogQueryKeys.postListing(filters),
        queryFn: getAdminBlogPosts,
    });

export const getAdminBlogPostByIdOpts = (id: string) =>
    queryOptions({
        queryKey: BlogQueryKeys.postById(id),
        queryFn: getAdminBlogPostById,
    });

export const getBlogTagsOpts = queryOptions({
    queryKey: BlogQueryKeys.tags(),
    queryFn: getBlogTags,
});

export const getPublicBlogPostsOpts = (filters: { page?: number; limit?: number }) =>
    queryOptions({
        queryKey: BlogQueryKeys.publicListing(filters),
        queryFn: getPublicBlogPosts,
    });

export const getPublicBlogPostBySlugOpts = (slug: string) =>
    queryOptions({
        queryKey: BlogQueryKeys.publicBySlug(slug),
        queryFn: getPublicBlogPostBySlug,
    });

// ── Mutation options ──────────────────────────────────────────────────────────

export const createBlogPostOpts = () =>
    mutationOptions({
        mutationKey: [...BlogQueryKeys.posts(), "create"],
        mutationFn: createBlogPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BlogQueryKeys.posts() });
        },
    });

export const updateBlogPostOpts = (id: string) =>
    mutationOptions({
        mutationKey: BlogQueryKeys.postById(id),
        mutationFn: updateBlogPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BlogQueryKeys.postById(id) });
            queryClient.invalidateQueries({ queryKey: BlogQueryKeys.posts() });
        },
    });

export const updateBlogPostStatusOpts = (id: string) =>
    mutationOptions({
        mutationKey: [...BlogQueryKeys.postById(id), "status"],
        mutationFn: updateBlogPostStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BlogQueryKeys.posts() });
            queryClient.invalidateQueries({ queryKey: BlogQueryKeys.postById(id) });
        },
    });

export const deleteBlogPostOpts = (id: string) =>
    mutationOptions({
        mutationKey: [...BlogQueryKeys.postById(id), "delete"],
        mutationFn: deleteBlogPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BlogQueryKeys.posts() });
        },
    });

export const createBlogTagOpts = () =>
    mutationOptions({
        mutationKey: [...BlogQueryKeys.tags(), "create"],
        mutationFn: createBlogTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BlogQueryKeys.tags() });
        },
    });

export const deleteBlogTagOpts = (id: string) =>
    mutationOptions({
        mutationKey: [...BlogQueryKeys.tags(), "delete", { id }],
        mutationFn: deleteBlogTag,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: BlogQueryKeys.tags() });
        },
    });

export const uploadBlogImageOpts = () =>
    mutationOptions({
        mutationKey: [...BlogQueryKeys.all(), "uploads"],
        mutationFn: uploadBlogImage,
    });

// ── Fetch functions ───────────────────────────────────────────────────────────

export async function getAdminBlogPosts(
    ctx: QueryFunctionContext<QKBlogPostListing>,
): Promise<TBlogPostListingResult> {
    const { filters } = ctx.queryKey[3];
    const qs = objectToQueryString(filters as Record<string, any>);
    const url = "/api/admin/blog/posts" + (qs ? "?" + qs : "");
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener los posts");
    return data;
}

export async function getAdminBlogPostById(
    ctx: QueryFunctionContext<QKBlogPostById>,
): Promise<TBlogPostDetailResult> {
    const { id } = ctx.queryKey[3];
    const res = await fetch(`/api/admin/blog/posts/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener el post");
    return data;
}

export async function getBlogTags(): Promise<TBlogTagListingResult> {
    const res = await fetch("/api/admin/blog/tags");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener los tags");
    return data;
}

export async function createBlogPost(
    payload: TBlogPostCreatePayload,
): Promise<TBlogPostCreateResult> {
    const res = await fetch("/api/admin/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al crear el post");
    return data;
}

export async function updateBlogPost(
    payload: TBlogPostUpdatePayload & { id: string },
): Promise<TBlogPostUpdateResult> {
    const { id, ...body } = payload;
    const res = await fetch(`/api/admin/blog/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al actualizar el post");
    return data;
}

export async function updateBlogPostStatus(
    payload: TBlogPostStatusPayload & { id: string },
): Promise<TBlogPostStatusResult> {
    const { id, status } = payload;
    const res = await fetch(`/api/admin/blog/posts/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al actualizar el estado");
    return data;
}

export async function deleteBlogPost(
    payload: { id: string },
): Promise<TBlogPostDeleteResult> {
    const res = await fetch(`/api/admin/blog/posts/${payload.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al eliminar el post");
    return data;
}

export async function createBlogTag(
    payload: { name: string },
): Promise<TBlogTagCreateResult> {
    const res = await fetch("/api/admin/blog/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al crear el tag");
    return data;
}

export async function deleteBlogTag(
    payload: { id: string },
): Promise<TBlogTagDeleteResult> {
    const res = await fetch(`/api/admin/blog/tags/${payload.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al eliminar el tag");
    return data;
}

export async function getPublicBlogPosts(
    ctx: QueryFunctionContext<QKPublicBlogPostListing>,
): Promise<TBlogPostListingResult> {
    const { filters } = ctx.queryKey[3];
    const qs = objectToQueryString(filters as Record<string, any>);
    const url = "/api/blog/posts" + (qs ? "?" + qs : "");
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener los posts");
    return data;
}

export async function getPublicBlogPostBySlug(
    ctx: QueryFunctionContext<QKPublicBlogPostBySlug>,
): Promise<TBlogPostDetailResult> {
    const { slug } = ctx.queryKey[3];
    const res = await fetch(`/api/blog/posts/${slug}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener el post");
    return data;
}

export async function uploadBlogImage(
    payload: { file: File },
): Promise<TBlogImageUploadResult> {
    const form = new FormData();
    form.append("image", payload.file);
    const res = await fetch("/api/admin/blog/uploads", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir la imagen");
    return data;
}
