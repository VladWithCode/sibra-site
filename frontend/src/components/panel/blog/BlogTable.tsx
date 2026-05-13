import type { TBlogPost, TPagination } from "@/queries/type";
import { BlogRow } from "./BlogRow";
import { BlogPaginator } from "./BlogPaginator";

export function BlogTable({
    posts,
    pagination,
    isLoading,
}: {
    posts: TBlogPost[];
    pagination: TPagination;
    isLoading?: boolean;
}) {
    if (isLoading) {
        return <BlogTableSkeleton />;
    }

    if (posts.length === 0) {
        return (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-10 text-center">
                <p className="text-sm font-semibold text-on-surface">Sin posts</p>
                <p className="text-xs text-outline mt-1">
                    Ajusta los filtros o crea un nuevo post.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low text-left">
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">Título / Slug</th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">Estado</th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">Lectura</th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">Publicado</th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">Actualizado</th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                        {posts.map((p) => (
                            <BlogRow key={p.id} post={p} />
                        ))}
                    </tbody>
                </table>
            </div>
            <BlogPaginator pagination={pagination} />
        </div>
    );
}

function BlogTableSkeleton() {
    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-surface-container animate-pulse" />
            ))}
        </div>
    );
}
