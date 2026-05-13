import type { TBlogPost } from "@/queries/type";
import { updateBlogPostStatusOpts } from "@/queries/blog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Archive, Edit2, Eye, EyeOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BlogDeleteDialog } from "./BlogDeleteDialog";
import { BlogStatusBadge } from "./BlogStatusBadge";
import { getProfileOpts } from "@/queries/auth";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function formatDate(iso: string) {
    if (!iso || iso.startsWith("0001-")) return "—";
    try {
        return format(new Date(iso), "d MMM yyyy", { locale: es });
    } catch {
        return "—";
    }
}

export function BlogRow({ post }: { post: TBlogPost }) {
    const navigate = useNavigate();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const { data: profile } = useQuery(getProfileOpts);
    const isAdmin = profile?.user?.role === "admin";

    const statusMut = useMutation(updateBlogPostStatusOpts(post.id));

    const changeStatus = (status: TBlogPost["status"]) => {
        statusMut.mutate(
            { id: post.id, status },
            {
                onSuccess: () => toast.success("Estado actualizado.", { closeButton: true }),
                onError: (err) => toast.error(err.message, { closeButton: true }),
            },
        );
    };

    const detailHref = { to: "/panel/blog/$id", params: { id: post.id } } as const;
    const stop = (e: React.MouseEvent | React.KeyboardEvent) => e.stopPropagation();

    return (
        <tr
            className="group cursor-pointer hover:bg-surface-bright transition-colors duration-200"
            onClick={() => navigate(detailHref)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); navigate(detailHref); } }}
            tabIndex={0}
            role="link"
            aria-label={`Editar ${post.title}`}
        >
            <td className="px-6 py-4">
                <div className="min-w-0">
                    <Link
                        {...detailHref}
                        onClick={stop}
                        className="text-sm font-bold text-on-surface line-clamp-1 hover:text-sbr-blue"
                    >
                        {post.title || "Sin título"}
                    </Link>
                    <p className="text-[11px] text-outline font-mono line-clamp-1 mt-0.5">{post.slug}</p>
                </div>
            </td>
            <td className="px-6 py-4">
                <BlogStatusBadge status={post.status} />
            </td>
            <td className="px-6 py-4 text-sm text-on-surface-variant">
                {post.readingTime > 0 ? `${post.readingTime} min` : "—"}
            </td>
            <td className="px-6 py-4 text-sm text-on-surface-variant">
                {formatDate(post.publishedAt)}
            </td>
            <td className="px-6 py-4 text-sm text-on-surface-variant">
                {formatDate(post.updatedAt)}
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    {/* Edit — always visible for non-archived */}
                    {post.status !== "archived" && (
                        <Link
                            {...detailHref}
                            onClick={stop}
                            title="Editar"
                            className="p-2 text-on-surface-variant hover:text-sbr-blue hover:bg-sbr-blue/5 rounded-lg transition-all"
                        >
                            <Edit2 className="size-4" />
                        </Link>
                    )}

                    {/* Publish (draft → published) */}
                    {post.status === "draft" && (
                        <button
                            type="button"
                            title="Publicar"
                            disabled={statusMut.isPending}
                            onClick={(e) => { stop(e); changeStatus("published"); }}
                            className="p-2 text-on-surface-variant hover:text-sbr-green-dark hover:bg-sbr-green/10 rounded-lg transition-all disabled:opacity-40"
                        >
                            <Eye className="size-4" />
                        </button>
                    )}

                    {/* Unpublish (published → draft) — admin only */}
                    {post.status === "published" && isAdmin && (
                        <button
                            type="button"
                            title="Despublicar"
                            disabled={statusMut.isPending}
                            onClick={(e) => { stop(e); changeStatus("draft"); }}
                            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-all disabled:opacity-40"
                        >
                            <EyeOff className="size-4" />
                        </button>
                    )}

                    {/* Archive — admin only, not already archived */}
                    {post.status !== "archived" && isAdmin && (
                        <button
                            type="button"
                            title="Archivar"
                            disabled={statusMut.isPending}
                            onClick={(e) => { stop(e); changeStatus("archived"); }}
                            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-all disabled:opacity-40"
                        >
                            <Archive className="size-4" />
                        </button>
                    )}

                    {/* Delete — admin only */}
                    {isAdmin && (
                        <button
                            type="button"
                            title="Eliminar"
                            onClick={(e) => { stop(e); setDeleteOpen(true); }}
                            className="p-2 text-on-surface-variant hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    )}
                </div>
                <BlogDeleteDialog
                    postId={post.id}
                    postTitle={post.title}
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                />
            </td>
        </tr>
    );
}
