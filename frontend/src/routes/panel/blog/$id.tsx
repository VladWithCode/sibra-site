import { ContentSection } from "@/components/dashboard/blog/ContentSection";
import { MainInfoSection } from "@/components/dashboard/blog/MainInfoSection";
import { TagsSection } from "@/components/dashboard/blog/TagsSection";
import { BlogDeleteDialog } from "@/components/panel/blog/BlogDeleteDialog";
import { BlogStatusBadge } from "@/components/panel/blog/BlogStatusBadge";
import { Button } from "@/components/ui/button";
import {
    getAdminBlogPostByIdOpts,
    getBlogTagsOpts,
    updateBlogPostOpts,
    updateBlogPostStatusOpts,
} from "@/queries/blog";
import type { TBlogPostStatus } from "@/queries/type";
import { getProfileOpts } from "@/queries/auth";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Archive, ArrowLeft, Eye, EyeOff, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/blog/$id")({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        const [postData] = await Promise.all([
            context.queryClient.ensureQueryData(getAdminBlogPostByIdOpts(params.id)),
            context.queryClient.ensureQueryData(getBlogTagsOpts),
        ]);
        return { postTitle: postData.post.title };
    },
});

function RouteComponent() {
    const { id } = Route.useParams();
    const [deleteOpen, setDeleteOpen] = useState(false);

    const { data: postData, isLoading, error } = useQuery(getAdminBlogPostByIdOpts(id));
    const { data: profile } = useQuery(getProfileOpts);
    const isAdmin = profile?.user?.role === "admin";
    const currentUserId = profile?.user?.id;

    const updateMut = useMutation(updateBlogPostOpts(id));
    const statusMut = useMutation(updateBlogPostStatusOpts(id));

    const post = postData?.post;
    const isArchived = post?.status === "archived";

    // Determine if user can edit: admin can edit any non-archived; editor can only edit own drafts
    const canEdit = post
        ? isAdmin
            ? !isArchived
            : post.status === "draft" && post.authorId === currentUserId
        : false;

    const form = useForm({
        defaultValues: {
            title:       post?.title ?? "",
            snippet:     post?.snippet ?? "",
            content:     postData?.content ?? "",
            coverImage:  post?.coverImage ?? "",
            readingTime: post?.readingTime as number | undefined,
            tagIds:      post?.tags?.map((t) => t.id) ?? [] as string[],
        },
        onSubmit: async ({ value }) => {
            try {
                await updateMut.mutateAsync({
                    id,
                    title:       value.title,
                    snippet:     value.snippet || undefined,
                    content:     value.content,
                    coverImage:  value.coverImage || undefined,
                    tagIds:      value.tagIds?.length ? value.tagIds : [],
                });
                toast.success("Post actualizado.", { closeButton: true });
            } catch (e: any) {
                toast.error(e?.message || "Error al actualizar el post", { closeButton: true });
            }
        },
    });

    const changeStatus = (status: TBlogPostStatus) => {
        statusMut.mutate(
            { id, status },
            {
                onSuccess: () => toast.success("Estado actualizado.", { closeButton: true }),
                onError: (err) => toast.error(err.message, { closeButton: true }),
            },
        );
    };

    if (isLoading) {
        return (
            <main className="p-6 lg:p-8">
                <div className="mx-auto max-w-5xl space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-xl bg-surface-container animate-pulse" />
                    ))}
                </div>
            </main>
        );
    }

    if (error || !post) {
        return (
            <main className="p-6 lg:p-8">
                <div className="mx-auto max-w-5xl">
                    <p className="text-destructive text-sm font-semibold">
                        {(error as Error)?.message || "Post no encontrado"}
                    </p>
                    <Link to="/panel/blog" className="text-sm text-sbr-blue underline mt-2 inline-block">
                        ← Volver al listado
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="bg-surface min-h-screen w-full p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                {/* Header */}
                <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1.5">
                        <Link
                            to="/panel/blog"
                            className="inline-flex items-center gap-1 text-xs text-outline hover:text-on-surface transition-colors"
                        >
                            <ArrowLeft className="size-3" />
                            Volver a posts
                        </Link>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl font-extrabold tracking-tight">{post.title}</h1>
                            <BlogStatusBadge status={post.status} />
                        </div>
                        <p className="text-muted-foreground text-sm font-mono">{post.slug}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                        {/* Publish (draft → published): admin can publish any draft;
                            editor can only publish their own draft */}
                        {post.status === "draft" && (isAdmin || post.authorId === currentUserId) && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={statusMut.isPending}
                                onClick={() => changeStatus("published")}
                            >
                                <Eye className="size-4" />
                                Publicar
                            </Button>
                        )}

                        {/* Unpublish (published → draft) — admin only */}
                        {post.status === "published" && isAdmin && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={statusMut.isPending}
                                onClick={() => changeStatus("draft")}
                            >
                                <EyeOff className="size-4" />
                                Despublicar
                            </Button>
                        )}

                        {/* Archive — admin only, not already archived */}
                        {post.status !== "archived" && isAdmin && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={statusMut.isPending}
                                onClick={() => changeStatus("archived")}
                            >
                                <Archive className="size-4" />
                                Archivar
                            </Button>
                        )}

                        {/* Delete — admin only */}
                        {isAdmin && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteOpen(true)}
                            >
                                <Trash2 className="size-4" />
                                Eliminar
                            </Button>
                        )}

                        {/* Save — only when editable */}
                        {canEdit && (
                            <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
                                {({ canSubmit, isSubmitting }) => (
                                    <Button
                                        size="sm"
                                        type="submit"
                                        form="edit-blog-post-form"
                                        disabled={!canSubmit || isSubmitting}
                                    >
                                        <Save className="size-4" />
                                        {isSubmitting ? "Guardando…" : "Guardar"}
                                    </Button>
                                )}
                            </form.Subscribe>
                        )}
                    </div>
                </header>

                {isArchived && (
                    <div className="rounded-lg bg-surface-container border border-outline-variant/30 px-4 py-3 text-sm text-on-surface-variant">
                        Este post está archivado y no puede editarse.
                    </div>
                )}

                {canEdit ? (
                    <form
                        id="edit-blog-post-form"
                        className="space-y-8"
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                    >
                        <MainInfoSection form={form} readonlySlug={post.slug} />
                        <ContentSection form={form} />
                        <TagsSection form={form} />
                    </form>
                ) : (
                    /* Read-only view for non-editable posts (published viewed by editor, archived) */
                    <div className="space-y-8">
                        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6 space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-outline uppercase tracking-wider mb-1">Título</p>
                                <p className="text-sm text-on-surface">{post.title}</p>
                            </div>
                            {post.snippet && (
                                <div>
                                    <p className="text-xs font-semibold text-outline uppercase tracking-wider mb-1">Resumen</p>
                                    <p className="text-sm text-on-surface-variant">{post.snippet}</p>
                                </div>
                            )}
                            {post.tags.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-outline uppercase tracking-wider mb-2">Tags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {post.tags.map((t) => (
                                            <span key={t.id} className="rounded-full bg-surface-container px-3 py-0.5 text-xs font-semibold text-on-surface-variant border border-outline-variant/30">
                                                {t.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {postData?.content && (
                            <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
                                <p className="text-xs font-semibold text-outline uppercase tracking-wider mb-3">Contenido (Markdown)</p>
                                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-on-surface-variant">
                                    {postData.content}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <BlogDeleteDialog
                postId={post.id}
                postTitle={post.title}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                redirectOnSuccess
            />
        </main>
    );
}
