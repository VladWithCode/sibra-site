import { Card, CardContent } from "@/components/ui/card";
import type { TBlogPost } from "@/queries/type";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BookOpen, Calendar, Tag } from "lucide-react";

export function BlogCard({ post }: { post: TBlogPost }) {
    const publishedDate = post.publishedAt
        ? format(new Date(post.publishedAt), "d 'de' MMMM, yyyy", { locale: es })
        : null;

    return (
        <Card className="group relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 pt-0 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
            {/* Cover image */}
            <Link to="/blog/$slug" params={{ slug: post.slug }} className="block shrink-0">
                <div className="aspect-video w-full overflow-hidden bg-surface-container">
                    {post.coverImage ? (
                        <img
                            src={post.coverImage.startsWith("/") ? post.coverImage : `/static/uploads/${post.coverImage}`}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container">
                            <BookOpen className="size-10 text-outline/30" />
                        </div>
                    )}
                </div>
            </Link>

            <CardContent className="flex flex-col flex-1 p-5 gap-3">
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag.id}
                                className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-semibold text-sbr-blue"
                            >
                                <Tag className="size-2.5" />
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Title */}
                <Link to="/blog/$slug" params={{ slug: post.slug }}>
                    <h3 className="font-headline text-lg font-bold text-on-surface tracking-tight leading-snug line-clamp-2 group-hover:text-sbr-blue transition-colors">
                        {post.title}
                    </h3>
                </Link>

                {/* Snippet */}
                {post.snippet && (
                    <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3 flex-1">
                        {post.snippet}
                    </p>
                )}

                {/* Metadata footer */}
                <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/20 text-xs text-outline mt-auto">
                    {publishedDate && (
                        <span className="flex items-center gap-1">
                            <Calendar className="size-3 shrink-0" />
                            {publishedDate}
                        </span>
                    )}
                    {post.readingTime > 0 && (
                        <span className="flex items-center gap-1 ml-auto">
                            <BookOpen className="size-3 shrink-0" />
                            {post.readingTime} min de lectura
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
