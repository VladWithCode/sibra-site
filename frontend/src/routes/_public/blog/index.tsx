import { BlogCard } from "@/components/blog/BlogCard";
import { LoadingCircles } from "@/components/icons/loadingCircles";
import { getPublicBlogPostsOpts } from "@/queries/blog";
import type { TPagination } from "@/queries/type";
import { useUIStore } from "@/stores/uiStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, Newspaper } from "lucide-react";
import { Suspense, useEffect } from "react";
import { z } from "zod";

const BlogSearchSchema = z.object({
    page:  z.number().int().positive().optional(),
    limit: z.number().int().positive().max(20).optional(),
});

type TBlogSearch = z.infer<typeof BlogSearchSchema>;

const toFilters = (s: TBlogSearch) => ({ page: s.page ?? 1, limit: s.limit ?? 9 });

export const Route = createFileRoute("/_public/blog/")({
    component: RouteComponent,
    validateSearch: (search) => BlogSearchSchema.parse(search),
    loaderDeps: ({ search }) => toFilters(search),
    loader: async ({ context, deps }) => {
        await context.queryClient.ensureQueryData(getPublicBlogPostsOpts(deps));
    },
});

function RouteComponent() {
    return (
        <Suspense fallback={<BlogListingLoading />}>
            <BlogListingContent />
        </Suspense>
    );
}

function BlogListingContent() {
    const search = Route.useSearch();
    const filters = toFilters(search);
    const { data } = useSuspenseQuery(getPublicBlogPostsOpts(filters));
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();

    useEffect(() => {
        setHeaderFloating(true);
        setHeaderComplementProps({ complementType: "none" });
        document.title = "Blog inmobiliario | Sibra Inmobiliaria";
        return () => { document.title = "Sibra Inmobiliaria"; };
    }, []);

    const posts = data.posts ?? [];
    const pagination: TPagination | undefined = data.pagination;

    return (
        <main>
            {/* Hero */}
            <section className="relative flex items-end overflow-hidden bg-sbr-blue-dark min-h-[280px] md:min-h-[340px]">
                <div className="absolute inset-0 bg-gradient-to-br from-sbr-blue-dark via-sbr-blue to-sbr-blue-dark/80" />
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pb-12 pt-32 md:pb-16">
                    <div className="max-w-2xl text-white">
                        <div className="flex items-center gap-2 mb-3 text-white/60 text-sm font-medium uppercase tracking-widest">
                            <Newspaper className="size-4" />
                            Blog
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-3">
                            Artículos y noticias
                        </h1>
                        <p className="text-white/70 text-base leading-relaxed">
                            Consejos, tendencias y noticias del mercado inmobiliario.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="bg-surface py-12 px-6 md:px-12">
                <div className="max-w-7xl mx-auto space-y-10">
                    {posts.length === 0 ? (
                        <BlogEmptyState />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                                {posts.map((post) => (
                                    <BlogCard key={post.id} post={post} />
                                ))}
                            </div>
                            {pagination && <BlogPagination pagination={pagination} />}
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}

function BlogPagination({ pagination }: { pagination: TPagination }) {
    const navigate = useNavigate();
    const { page, perPage, total, hasNext, hasPrev } = pagination;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    const goTo = (n: number) => {
        navigate({
            to: "/blog",
            search: (prev: any) => ({ ...prev, page: n <= 1 ? undefined : n }),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-3 pt-4">
            <button
                type="button"
                disabled={!hasPrev}
                onClick={() => goTo(page - 1)}
                className="px-4 py-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Anterior
            </button>
            <span className="text-sm text-on-surface-variant px-2">
                Página {page} de {totalPages}
            </span>
            <button
                type="button"
                disabled={!hasNext}
                onClick={() => goTo(page + 1)}
                className="px-4 py-2 rounded-lg bg-sbr-blue text-white text-sm font-semibold hover:bg-sbr-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Siguiente
            </button>
        </div>
    );
}

function BlogEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen className="size-12 text-outline/30 mb-4" />
            <h2 className="text-xl font-semibold text-on-surface mb-2">No hay artículos publicados aún</h2>
            <p className="text-sm text-on-surface-variant max-w-sm">
                Pronto publicaremos contenido sobre el mercado inmobiliario. Vuelve pronto.
            </p>
        </div>
    );
}

function BlogListingLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <LoadingCircles className="text-sbr-blue" />
            <p className="text-on-surface-variant text-sm">Cargando artículos…</p>
        </div>
    );
}
