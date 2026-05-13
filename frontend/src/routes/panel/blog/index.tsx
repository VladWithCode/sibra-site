import { BlogFilters } from "@/components/panel/blog/BlogFilters";
import { BlogHeader } from "@/components/panel/blog/BlogHeader";
import { BlogTable } from "@/components/panel/blog/BlogTable";
import { getAdminBlogPostsOpts } from "@/queries/blog";
import type { TBlogPostFilters, TBlogPostStatus } from "@/queries/type";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BlogSearchSchema = z.object({
    q:      z.string().optional().catch(undefined),
    status: z.enum(["draft", "published", "archived"]).optional().catch(undefined),
    page:   z.coerce.number().int().positive().optional().catch(undefined),
});

type BlogSearch = z.infer<typeof BlogSearchSchema>;

function toFilters(search: BlogSearch): Partial<TBlogPostFilters> {
    return {
        search: search.q || undefined,
        status: search.status as TBlogPostStatus | undefined,
        page:   search.page,
        limit:  20,
    };
}

export const Route = createFileRoute("/panel/blog/")({
    component: RouteComponent,
    validateSearch: (search) => BlogSearchSchema.parse(search),
    loaderDeps: ({ search }) => toFilters(search),
    loader: async ({ context, deps }) => {
        await context.queryClient.ensureQueryData(getAdminBlogPostsOpts(deps));
    },
});

function RouteComponent() {
    const search = Route.useSearch();
    const filters = toFilters(search);
    const { data, isLoading } = useQuery(getAdminBlogPostsOpts(filters));

    const posts = data?.posts ?? [];
    const pagination = data?.pagination ?? { total: 0, page: 1, perPage: 20, hasNext: false, hasPrev: false };

    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <BlogHeader />
            <BlogFilters filters={{ q: search.q, status: search.status }} />
            <BlogTable posts={posts} pagination={pagination} isLoading={isLoading} />
        </main>
    );
}
