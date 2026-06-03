import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    deleteSellingPageOpts,
    listSellingPagesOpts,
    setSellingPagePublishedOpts,
} from "@/queries/sellingPages";
import type { TSellingPage } from "@/queries/type";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/terrenos/")({
    component: RouteComponent,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(listSellingPagesOpts());
    },
});

function RouteComponent() {
    const { data, isLoading } = useQuery(listSellingPagesOpts());
    const pages = data?.pages ?? [];

    return (
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Páginas de venta</h1>
                <Button asChild>
                    <Link to="/panel/terrenos/nuevo">Nueva página</Link>
                </Button>
            </div>

            {isLoading ? (
                <p className="text-muted-foreground">Cargando…</p>
            ) : pages.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No hay páginas de venta. Crea la primera.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {pages.map((p) => (
                        <SellingPageRow key={p.id} page={p} />
                    ))}
                </div>
            )}
        </main>
    );
}

function SellingPageRow({ page }: { page: TSellingPage }) {
    const publishMut = useMutation(setSellingPagePublishedOpts(page.id));
    const deleteMut = useMutation(deleteSellingPageOpts(page.id));

    async function togglePublished() {
        try {
            await publishMut.mutateAsync(!page.published);
            toast.success(page.published ? "Despublicada" : "Publicada", {
                closeButton: true,
            });
        } catch (e: any) {
            toast.error(e?.message || "Error", { closeButton: true });
        }
    }

    async function onDelete() {
        if (!confirm(`¿Eliminar "${page.name}"?`)) return;
        try {
            await deleteMut.mutateAsync();
            toast.success("Página eliminada", { closeButton: true });
        } catch (e: any) {
            toast.error(e?.message || "Error", { closeButton: true });
        }
    }

    return (
        <Card>
            <CardContent className="flex flex-wrap items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{page.name}</span>
                        {page.published ? (
                            <Badge>Publicada</Badge>
                        ) : (
                            <Badge variant="secondary">Borrador</Badge>
                        )}
                        <Badge variant="outline">{page.variant}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        /{page.slug}
                        {page.updatedAt
                            ? ` · ${new Date(page.updatedAt).toLocaleDateString()}`
                            : ""}
                    </p>
                </div>
                {page.published ? (
                    <Button asChild variant="ghost" size="sm">
                        <a href={`/terrenos/${page.slug}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-4" /> Ver
                        </a>
                    </Button>
                ) : null}
                <Button asChild variant="outline" size="sm">
                    <Link to="/panel/terrenos/$id" params={{ id: page.id }}>
                        <Pencil className="size-4" /> Editar
                    </Link>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={publishMut.isPending}
                    onClick={togglePublished}
                >
                    {page.published ? "Despublicar" : "Publicar"}
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteMut.isPending}
                    onClick={onDelete}
                >
                    <Trash2 className="size-4" />
                </Button>
            </CardContent>
        </Card>
    );
}
