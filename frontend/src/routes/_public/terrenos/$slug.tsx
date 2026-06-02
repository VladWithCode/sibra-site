import { PublicLayout } from "@/components/layout/publicLayout";
import { SellingPageTemplate } from "@/components/selling-pages/SellingPageTemplate";
import { mergeSellingPage } from "@/components/selling-pages/normalize";
import { getSellingPageBySlugOpts } from "@/queries/sellingPages";
import { useUIStore } from "@/stores/uiStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLayoutEffect, useMemo } from "react";

export const Route = createFileRoute("/_public/terrenos/$slug")({
    component: RouteComponent,
    errorComponent: SellingPageError,
    loader: async ({ context, params }) => {
        return await context.queryClient.ensureQueryData(getSellingPageBySlugOpts(params.slug));
    },
    head: ({ loaderData }) => {
        const page = loaderData?.page;
        const links = [];
        if (page?.heroImage) {
            links.push({
                rel: "preload",
                as: "image",
                href: `/static/uploads/${page.heroImage}`,
            });
        }
        return {
            meta: [
                { title: page?.seoTitle || page?.name || "Terreno | SIBRA" },
                {
                    name: "description",
                    content: page?.seoDescription || "",
                },
            ],
            links,
        };
    },
});

function RouteComponent() {
    const { slug } = Route.useParams();
    const { setHeaderFloating, setHeaderComplement } = useUIStore();
    const { data } = useSuspenseQuery(getSellingPageBySlugOpts(slug));

    useLayoutEffect(() => {
        setHeaderFloating(true);
        setHeaderComplement("none");
    }, []);

    const merged = useMemo(() => mergeSellingPage(data.page), [data.page]);

    return (
        <PublicLayout>
            <SellingPageTemplate data={merged} />
        </PublicLayout>
    );
}

function SellingPageError() {
    return (
        <PublicLayout>
            <main className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
                <h1 className="text-3xl font-semibold">Página no encontrada</h1>
                <p className="text-muted-foreground">
                    El terreno que buscas no existe o no está disponible.
                </p>
                <Link to="/" className="underline underline-offset-4">
                    Volver al inicio
                </Link>
            </main>
        </PublicLayout>
    );
}
