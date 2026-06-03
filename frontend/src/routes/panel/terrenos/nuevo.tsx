import { SellingPageForm } from "@/components/dashboard/sellingPage/SellingPageForm";
import {
    SellingPageFormSchema,
    buildSellingPagePayload,
    sellingPageFormDefaults,
} from "@/components/dashboard/sellingPage/schema";
import { Button } from "@/components/ui/button";
import { createSellingPageOpts } from "@/queries/sellingPages";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/terrenos/nuevo")({
    component: RouteComponent,
});

function RouteComponent() {
    const navigate = useNavigate();
    const createMut = useMutation(createSellingPageOpts());

    const form = useForm({
        defaultValues: sellingPageFormDefaults,
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
                const result = await createMut.mutateAsync(payload);
                toast.success("Página creada. Ahora puedes subir multimedia.", {
                    closeButton: true,
                });
                navigate({
                    to: "/panel/terrenos/$id",
                    params: { id: result.page.id },
                });
            } catch (e: any) {
                toast.error(e?.message || "Error al crear", { closeButton: true });
            }
        },
    });

    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Nueva página de venta</h1>
                <Button asChild variant="ghost">
                    <Link to="/panel/terrenos">Cancelar</Link>
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
                    <Button type="submit" disabled={createMut.isPending}>
                        <Save className="size-4" /> Crear
                    </Button>
                </div>
            </form>
        </main>
    );
}
