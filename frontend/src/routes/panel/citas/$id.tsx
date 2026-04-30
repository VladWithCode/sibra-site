import { QuoteFormFields } from "@/components/dashboard/quote/QuoteFormFields";
import {
    QuoteFormSchema,
    buildQuotePayload,
    quoteToFormValues,
} from "@/components/dashboard/quote/schema";
import { Button } from "@/components/ui/button";
import { getSingleQuoteOpts, updateQuoteOpts } from "@/queries/quotes";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/citas/$id")({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(
            getSingleQuoteOpts(params.id),
        );
    },
});

function RouteComponent() {
    const { id } = Route.useParams();
    const { data } = useSuspenseQuery(getSingleQuoteOpts(id));
    const quote = data.request;

    const updateMut = useMutation(updateQuoteOpts(id, {}));

    const form = useForm({
        defaultValues: quoteToFormValues(quote),
        validators: { onChange: QuoteFormSchema },
        onSubmit: async ({ value }) => {
            try {
                const payload = buildQuotePayload(value);
                await updateMut.mutateAsync({ id, quote: payload });
                toast.success("Solicitud actualizada", { closeButton: true });
            } catch (e: any) {
                toast.error(
                    e?.message || "Error al actualizar la solicitud",
                    { closeButton: true },
                );
            }
        },
    });

    return (
        <main className="bg-surface min-h-screen w-full p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-1.5">
                        <span className="text-primary text-xs font-semibold tracking-widest uppercase">
                            Gestión de solicitudes
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Editar solicitud
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Modifica los detalles de la solicitud.
                        </p>
                    </div>
                    <form.Subscribe
                        selector={(s) => ({
                            canSubmit: s.canSubmit,
                            isSubmitting: s.isSubmitting,
                        })}
                    >
                        {({ canSubmit, isSubmitting }) => (
                            <Button
                                size="lg"
                                type="submit"
                                form="edit-quote-form"
                                disabled={!canSubmit || isSubmitting}
                            >
                                <Save className="size-4" />
                                {isSubmitting ? "Guardando..." : "Guardar"}
                            </Button>
                        )}
                    </form.Subscribe>
                </header>

                <form
                    id="edit-quote-form"
                    className="space-y-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <QuoteFormFields form={form} />
                </form>
            </div>
        </main>
    );
}
