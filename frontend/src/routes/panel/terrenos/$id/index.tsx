import { FloatingSubmit } from "@/components/dashboard/sellingPage/FloatingSubmit";
import { MediaUploads } from "@/components/dashboard/sellingPage/MediaUploads";
import { SellingPageForm } from "@/components/dashboard/sellingPage/SellingPageForm";
import { SellingPagePreview } from "@/components/dashboard/sellingPage/SellingPagePreview";
import {
    SellingPageFormSchema,
    buildSellingPagePayload,
    formValuesFromPage,
} from "@/components/dashboard/sellingPage/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getSellingPageByIdOpts, updateSellingPageOpts } from "@/queries/sellingPages";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Save } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/terrenos/$id/")({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(getSellingPageByIdOpts(params.id));
    },
});

const FORM_ID = "selling-page-edit-form";

function RouteComponent() {
    const { id } = Route.useParams();
    const { data } = useSuspenseQuery(getSellingPageByIdOpts(id));
    const page = data.page;

    const updateMut = useMutation(updateSellingPageOpts(id));
    const submitRef = useRef<HTMLDivElement>(null);

    const form = useForm({
        defaultValues: formValuesFromPage(page),
        validators: { onChange: SellingPageFormSchema },
        onSubmit: async ({ value }) => {
            try {
                await updateMut.mutateAsync(buildSellingPagePayload(value));
                toast.success("Página actualizada", { closeButton: true });
            } catch (e: any) {
                toast.error(e?.message || "Error al actualizar", { closeButton: true });
            }
        },
    });

    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold">Editar: {page.name}</h1>
                <div className="flex items-center gap-2">
                    {/* Mobile preview */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="lg:hidden">
                                <Eye className="size-4" /> Ver vista previa
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            className="w-screen h-[100dvh] max-w-none p-0 gap-0 bg-background"
                            showCloseButton
                        >
                            <DialogTitle className="sr-only">Vista previa</DialogTitle>
                            <div className="h-full w-full overflow-auto">
                                <SellingPagePreview form={form} basePage={page} />
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button asChild variant="ghost">
                        <Link to="/panel/terrenos">Volver</Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Form column */}
                <div>
                    <form
                        id={FORM_ID}
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.handleSubmit();
                        }}
                        className="space-y-6"
                    >
                        <SellingPageForm form={form} />
                        <div ref={submitRef} className="flex justify-end">
                            <Button type="submit" disabled={updateMut.isPending}>
                                <Save className="size-4" /> Guardar cambios
                            </Button>
                        </div>
                    </form>
                    <div className="mt-8">
                        <MediaUploads pageId={id} page={page} />
                    </div>
                </div>

                {/* Desktop live preview */}
                <div className="hidden lg:block">
                    <div className="sticky top-4">
                        <p className="text-muted-foreground mb-2 text-sm font-medium">
                            Vista previa en vivo
                        </p>
                        <div className="h-[calc(100vh-7rem)] overflow-auto rounded-lg border">
                            <SellingPagePreview form={form} basePage={page} />
                        </div>
                    </div>
                </div>
            </div>

            <FloatingSubmit
                formId={FORM_ID}
                label="Guardar cambios"
                anchorRef={submitRef}
                disabled={updateMut.isPending}
            />
        </main>
    );
}
