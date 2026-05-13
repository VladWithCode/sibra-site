import { BlogMarkdown, extractToc } from "@/components/blog/BlogMarkdown";
import { BlogShareButtons } from "@/components/blog/BlogShareButtons";
import { BlogToC } from "@/components/blog/BlogToC";
import { LoadingCircles } from "@/components/icons/loadingCircles";
import { getPublicBlogPostBySlugOpts } from "@/queries/blog";
import { useUIStore } from "@/stores/uiStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, BookOpen, Calendar, Tag } from "lucide-react";
import { Suspense, useEffect, useMemo } from "react";

export const Route = createFileRoute("/_public/blog/$slug")({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(
            getPublicBlogPostBySlugOpts(params.slug),
        );
    },
});

function RouteComponent() {
    return (
        <Suspense fallback={<BlogPostLoading />}>
            <BlogPostContent />
        </Suspense>
    );
}

function BlogPostContent() {
    const { slug } = Route.useParams();
    const { data, status, error } = useSuspenseQuery(getPublicBlogPostBySlugOpts(slug));
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();

    useEffect(() => {
        setHeaderFloating(true);
        setHeaderComplementProps({ complementType: "none" });
    }, []);

    // Set document title before any early return so hook order is stable
    useEffect(() => {
        const title = data?.post?.title;
        if (title) document.title = `${title} | Sibra Inmobiliaria`;
        return () => { document.title = "Sibra Inmobiliaria"; };
    }, [data?.post?.title]);

    if (status === "error") {
        return <BlogPostError error={error as Error} />;
    }

    const { post, content } = data;

    const publishedDate = post.publishedAt
        ? format(new Date(post.publishedAt), "d 'de' MMMM, yyyy", { locale: es })
        : null;

    const toc = useMemo(() => (content ? extractToc(content) : []), [content]);

    // Build the canonical URL for share buttons
    const postUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/blog/${post.slug}`
            : `/blog/${post.slug}`;

    return (
        <main>
            {/* ── Hero ────────────────────────────────────────────────────── */}
            {post.coverImage ? (
                <section className="relative w-full flex items-end overflow-hidden min-h-[340px] md:min-h-[440px]">
                    <div className="absolute inset-0 z-0">
                        <img
                            src={
                                post.coverImage.startsWith("/")
                                    ? post.coverImage
                                    : `/static/uploads/${post.coverImage}`
                            }
                            alt={post.title}
                            className="w-full h-full object-cover"
                            loading="eager"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
                    </div>
                    <div className="relative z-10 max-w-5xl mx-auto w-full px-6 md:px-12 pb-10 pt-40">
                        <BackToBlog className="text-white/70 hover:text-white" />
                        <h1 className="mt-4 text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight max-w-3xl">
                            {post.title}
                        </h1>
                    </div>
                </section>
            ) : (
                <section className="bg-sbr-blue-dark pt-32 pb-10 px-6 md:px-12">
                    <div className="max-w-5xl mx-auto">
                        <BackToBlog className="text-white/60 hover:text-white" />
                        <h1 className="mt-4 text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight max-w-3xl">
                            {post.title}
                        </h1>
                    </div>
                </section>
            )}

            {/* ── Article body ────────────────────────────────────────────── */}
            <section className="bg-surface py-10 px-6 md:px-12">
                <div className="max-w-5xl mx-auto">

                    {/* Metadata row */}
                    <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-outline-variant/20 mb-8">
                        <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant">
                            {publishedDate && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="size-4 shrink-0" />
                                    {publishedDate}
                                </span>
                            )}
                            {post.readingTime > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <BookOpen className="size-4 shrink-0" />
                                    {post.readingTime} min de lectura
                                </span>
                            )}
                        </div>
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 ml-auto">
                                {post.tags.map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="inline-flex items-center gap-1 rounded-full border border-sbr-blue/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-sbr-blue"
                                    >
                                        <Tag className="size-3" />
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Two-column layout: article + aside ToC on desktop */}
                    <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-start">

                        {/* ── Main article column ──────────────────────── */}
                        <article className="flex-1 min-w-0">
                            {/* ToC — mobile only (above content) */}
                            {toc.length >= 2 && (
                                <div className="lg:hidden mb-8">
                                    <BlogToC entries={toc} />
                                </div>
                            )}

                            {/* Snippet / lead */}
                            {post.snippet && (
                                <p className="text-lg text-on-surface-variant leading-relaxed border-l-4 border-sbr-blue-light pl-4 italic mb-8">
                                    {post.snippet}
                                </p>
                            )}

                            {/* Rendered Markdown content */}
                            {content ? (
                                <BlogMarkdown content={content} />
                            ) : (
                                <div className="py-12 text-center text-on-surface-variant text-sm">
                                    Este artículo aún no tiene contenido.
                                </div>
                            )}

                            {/* Share buttons */}
                            <BlogShareButtons url={postUrl} title={post.title} />
                        </article>

                        {/* ── Sticky aside ToC — desktop only ─────────── */}
                        {toc.length >= 2 && (
                            <aside className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-24 self-start">
                                <BlogToC entries={toc} />
                            </aside>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}

function BackToBlog({ className }: { className?: string }) {
    return (
        <Link
            to="/blog"
            search={{}}
            className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${className ?? "text-on-surface-variant hover:text-on-surface"}`}
        >
            <ArrowLeft className="size-4" />
            Volver al blog
        </Link>
    );
}

function BlogPostError({ error }: { error: Error }) {
    const msg = error?.message ?? "Error desconocido";
    const isNotFound =
        msg.toLowerCase().includes("no encontrado") || msg.includes("404");

    return (
        <main className="bg-surface min-h-[60vh] flex items-center justify-center px-6">
            <div className="max-w-md text-center space-y-4">
                <BookOpen className="size-12 text-outline/30 mx-auto" />
                <h1 className="text-2xl font-bold text-on-surface">
                    {isNotFound ? "Artículo no encontrado" : "Error al cargar el artículo"}
                </h1>
                <p className="text-sm text-on-surface-variant">
                    {isNotFound
                        ? "El artículo que buscas no existe o no está publicado."
                        : "Ocurrió un error inesperado. Por favor intenta de nuevo más tarde."}
                </p>
                <Link
                    to="/blog"
                    search={{}}
                    className="inline-flex items-center gap-2 mt-2 text-sm font-semibold text-sbr-blue hover:underline"
                >
                    <ArrowLeft className="size-4" />
                    Volver al blog
                </Link>
            </div>
        </main>
    );
}

function BlogPostLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <LoadingCircles className="text-sbr-blue" />
            <p className="text-on-surface-variant text-sm">Cargando artículo…</p>
        </div>
    );
}
