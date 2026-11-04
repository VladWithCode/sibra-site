import { AmenitiesSection } from "@/components/dashboard/property/AmenitiesSection";
import { DetailsSection } from "@/components/dashboard/property/DetailsSection";
import { FeaturesSection } from "@/components/dashboard/property/FeaturesSection";
import { LocationMapSection } from "@/components/dashboard/property/LocationMapSection";
import { MainInfoSection } from "@/components/dashboard/property/MainInfoSection";
import { PropertyMediaManager } from "@/components/dashboard/property/PropertyMediaManager";
import {
    PropertyFormSchema,
    buildPropertyPayload,
    propertyToFormValues,
} from "@/components/dashboard/property/schema";
import { Button } from "@/components/ui/button";
import { getAmenitiesOpts } from "@/queries/amenities";
import { getFeaturesOpts } from "@/queries/features";
import { getSinglePropertyOpts, updatePropertyDetailsOpts } from "@/queries/properties";
import { getPropertyMediaOpts } from "@/queries/propertyMedia";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/propiedades/$id")({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        const [propertyData] = await Promise.all([
            context.queryClient.ensureQueryData(getSinglePropertyOpts(params.id)),
            context.queryClient.ensureQueryData(getFeaturesOpts),
            context.queryClient.ensureQueryData(getAmenitiesOpts),
            context.queryClient.ensureQueryData(getPropertyMediaOpts(params.id)),
        ]);
        return { propertyTitle: propertyData.property.title };
    },
});

function RouteComponent() {
    const { id } = Route.useParams();
    const { data } = useSuspenseQuery(getSinglePropertyOpts(id));
    const property = data.property;

    const updateMut = useMutation(updatePropertyDetailsOpts(id));

    const form = useForm({
        defaultValues: propertyToFormValues(property),
        validators: { onChange: PropertyFormSchema },
        onSubmit: async ({ value }) => {
            try {
                const payload = { ...buildPropertyPayload(value), id };
                await updateMut.mutateAsync(payload);
                toast.success("Propiedad actualizada", { closeButton: true });
            } catch (e: any) {
                toast.error(e?.message || "Error al actualizar la propiedad", {
                    closeButton: true,
                });
            }
        },
    });

    return (
        <main className="bg-surface min-h-screen w-full p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-1.5">
                        <span className="text-primary text-xs font-semibold tracking-widest uppercase">
                            Gestión de inventario
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Editar propiedad
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Modifica los detalles de la propiedad.
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
                                form="edit-property-form"
                                disabled={!canSubmit || isSubmitting}
                            >
                                <Save className="size-4" />
                                {isSubmitting ? "Guardando..." : "Guardar"}
                            </Button>
                        )}
                    </form.Subscribe>
                </header>

                <form
                    id="edit-property-form"
                    className="space-y-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <MainInfoSection form={form} />
                    <LocationMapSection form={form} />
                    <PropertyMediaManager propertyId={id} />
                    <DetailsSection form={form} property={property} />
                    <FeaturesSection form={form} />
                    <AmenitiesSection form={form} />
                </form>
            </div>
        </main>
    );
}
