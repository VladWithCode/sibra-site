import { AmenitiesSection } from "@/components/dashboard/project/AmenitiesSection";
import { AppealSection } from "@/components/dashboard/project/AppealSection";
import { DocsSection } from "@/components/dashboard/project/DocsSection";
import { LocationSection } from "@/components/dashboard/project/LocationSection";
import { MainInfoSection } from "@/components/dashboard/project/MainInfoSection";
import { MediaSection } from "@/components/dashboard/project/MediaSection";
import { SectionsSection } from "@/components/dashboard/project/SectionsSection";
import {
    ProjectFormSchema,
    buildProjectPayload,
    isSectionValid,
    projectFormDefaults,
} from "@/components/dashboard/project/schema";
import { Button } from "@/components/ui/button";
import {
    createProjectDocOpts,
    createProjectOpts,
    getAppealItemsOpts,
    uploadProjectAmenityOpts,
    uploadProjectAvailabilityOpts,
    uploadProjectGalleryOpts,
    uploadProjectMainImgOpts,
} from "@/queries/projects";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/proyectos/nuevo")({
    component: RouteComponent,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(getAppealItemsOpts);
    },
});

function RouteComponent() {
    const navigate = useNavigate();
    const [isSectionUploading, setIsSectionUploading] = useState(false);
    const createMut = useMutation(createProjectOpts());
    const mainImgMut = useMutation(uploadProjectMainImgOpts(""));
    const availabilityMut = useMutation(uploadProjectAvailabilityOpts(""));
    const galleryMut = useMutation(uploadProjectGalleryOpts(""));
    const amenityMut = useMutation(uploadProjectAmenityOpts(""));
    const docMut = useMutation(createProjectDocOpts(""));

    const form = useForm({
        defaultValues: projectFormDefaults,
        validators: { onChange: ProjectFormSchema },
        onSubmit: async ({ value }) => {
            // Reject empty sections client-side; backend also enforces.
            const badIdx = value.sections.findIndex((s) => !isSectionValid(s));
            if (badIdx !== -1) {
                toast.error(
                    `La sección ${badIdx + 1} debe tener texto o imagen.`,
                    { closeButton: true },
                );
                return;
            }
            try {
                const result = await createMut.mutateAsync(buildProjectPayload(value));
                const newId = result.project.id;
                toast.success("Proyecto creado", { closeButton: true });

                if (value.mainImg) {
                    try {
                        await mainImgMut.mutateAsync({
                            projectId: newId,
                            file: value.mainImg,
                        });
                    } catch (e: any) {
                        toast.warning(
                            `El proyecto se guardó, pero falló la imagen principal: ${
                                e?.message || ""
                            }`,
                            { closeButton: true },
                        );
                    }
                }

                if (value.availabilityImg) {
                    try {
                        await availabilityMut.mutateAsync({
                            projectId: newId,
                            file: value.availabilityImg,
                        });
                    } catch (e: any) {
                        toast.warning(
                            `El proyecto se guardó, pero falló el plano de disponibilidad: ${
                                e?.message || ""
                            }`,
                            { closeButton: true },
                        );
                    }
                }

                if (value.gallery.length > 0) {
                    try {
                        await galleryMut.mutateAsync({
                            projectId: newId,
                            files: value.gallery,
                        });
                    } catch (e: any) {
                        toast.warning(
                            `El proyecto se guardó, pero falló la galería: ${
                                e?.message || ""
                            }`,
                            { closeButton: true },
                        );
                    }
                }

                for (const amenity of value.amenities) {
                    try {
                        await amenityMut.mutateAsync({
                            projectId: newId,
                            name: amenity.name,
                            icon: amenity.icon,
                            file: amenity.file,
                        });
                    } catch (e: any) {
                        toast.warning(
                            `Falló al subir la amenidad "${amenity.name}": ${
                                e?.message || ""
                            }`,
                            { closeButton: true },
                        );
                    }
                }

                for (const doc of value.docs) {
                    if (!doc.file) continue;
                    try {
                        await docMut.mutateAsync({
                            projectId: newId,
                            file: doc.file,
                            filename: doc.name,
                            description: doc.description,
                        });
                    } catch (e: any) {
                        toast.warning(
                            `Falló al subir el documento "${doc.name}": ${
                                e?.message || ""
                            }`,
                            { closeButton: true },
                        );
                    }
                }

                navigate({
                    to: "/panel/proyectos/$id",
                    params: { id: newId },
                });
            } catch (e: any) {
                toast.error(e?.message || "Error al crear el proyecto", {
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
                            Gestión de proyectos
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Agregar nuevo proyecto
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Completa la información del proyecto, sus recursos visuales,
                            amenidades y documentos.
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
                                form="create-project-form"
                                disabled={!canSubmit || isSubmitting || isSectionUploading}
                            >
                                <Save className="size-4" />
                                {isSubmitting ? "Guardando..." : "Guardar"}
                            </Button>
                        )}
                    </form.Subscribe>
                </header>

                <form
                    id="create-project-form"
                    className="space-y-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <MainInfoSection form={form} />
                    <SectionsSection form={form} onUploadingChange={setIsSectionUploading} />
                    <LocationSection form={form} />
                    <MediaSection form={form} />
                    <AmenitiesSection form={form} />
                    <DocsSection form={form} />
                    <AppealSection form={form} />
                </form>
            </div>
        </main>
    );
}
