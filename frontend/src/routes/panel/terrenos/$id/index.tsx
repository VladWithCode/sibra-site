import { MediaUploads } from "@/components/dashboard/sellingPage/MediaUploads";
import { SellingPageForm } from "@/components/dashboard/sellingPage/SellingPageForm";
import {
    SellingPageFormSchema,
    buildSellingPagePayload,
    formValuesFromPage,
} from "@/components/dashboard/sellingPage/schema";
import { Button } from "@/components/ui/button";
import { getSellingPageByIdOpts, updateSellingPageOpts } from "@/queries/sellingPages";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/terrenos/$id/")({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(getSellingPageByIdOpts(params.id));
    },
});

function RouteComponent() {
    const { id } = Route.useParams();
    const { data } = useSuspenseQuery(getSellingPageByIdOpts(id));
    const page = data.page;

    const updateMut = useMutation(updateSellingPageOpts(id));

    const form = useForm({
        defaultValues: formValuesFromPage(page),
        validators: { onChange: SellingPageFormSchema },
        onSubmit: async ({ value }) => {
            let payload;
            try {
                payload = buildSellingPagePayload(value);
            } catch (e: any) {
                toast.error(e?.message || "JSON inválido", { closeButton: true });
                return;
            }
            try {
                await updateMut.mutateAsync(payload);
                toast.success("Página actualizada", { closeButton: true });
            } catch (e: any) {
                toast.error(e?.message || "Error al actualizar", { closeButton: true });
            }
        },
    });

    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Editar: {page.name}</h1>
                <Button asChild variant="ghost">
                    <Link to="/panel/terrenos">Volver</Link>
                </Button>
            </div>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
                className="max-w-3xl space-y-6"
            >
                <SellingPageForm form={form} />
                <div className="flex justify-end">
                    <Button type="submit" disabled={updateMut.isPending}>
                        <Save className="size-4" /> Guardar
                    </Button>
                </div>
            </form>

            <div className="mt-8 max-w-3xl">
                <MediaUploads pageId={id} page={page} />
            </div>
        </main>
    );
}
