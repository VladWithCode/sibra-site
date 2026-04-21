import { ProjectImage } from "@/components/Image";
import { AmenitiesSection } from "@/components/dashboard/project/AmenitiesSection";
import { AppealSection } from "@/components/dashboard/project/AppealSection";
import { DocsSection } from "@/components/dashboard/project/DocsSection";
import { LocationSection } from "@/components/dashboard/project/LocationSection";
import { MainInfoSection } from "@/components/dashboard/project/MainInfoSection";
import { MediaSection } from "@/components/dashboard/project/MediaSection";
import {
    ProjectFormSchema,
    buildProjectPayload,
    projectToFormValues,
} from "@/components/dashboard/project/schema";
import { LucideIcon } from "@/components/dashboard/property/LucideIcon";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    createProjectDocOpts,
    deleteProjectAmenityOpts,
    getAppealItemsOpts,
    getProjectDocsOpts,
    getProjectOpts,
    removeFromProjectGalleryOpts,
    removeProjectAvailabilityOpts,
    removeProjectDocOpts,
    removeProjectMainImgOpts,
    updateProjectOpts,
    uploadProjectAmenityOpts,
    uploadProjectAvailabilityOpts,
    uploadProjectGalleryOpts,
    uploadProjectMainImgOpts,
} from "@/queries/projects";
import type { TProject, TProjectDoc } from "@/queries/type";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/proyectos/$id/")({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await Promise.all([
            context.queryClient.ensureQueryData(getProjectOpts(params.id)),
            context.queryClient.ensureQueryData(getProjectDocsOpts(params.id)),
            context.queryClient.ensureQueryData(getAppealItemsOpts),
        ]);
    },
});

function RouteComponent() {
    const { id } = Route.useParams();
    const { data } = useSuspenseQuery(getProjectOpts(id));
    const project = data.project;
    const { data: docsData } = useSuspenseQuery(getProjectDocsOpts(id));
    const docs = docsData.docs ?? [];

    const updateMut = useMutation(updateProjectOpts(id));
    const mainImgMut = useMutation(uploadProjectMainImgOpts(id));
    const availabilityMut = useMutation(uploadProjectAvailabilityOpts(id));
    const galleryMut = useMutation(uploadProjectGalleryOpts(id));
    const amenityMut = useMutation(uploadProjectAmenityOpts(id));
    const docMut = useMutation(createProjectDocOpts(id));

    const deleteMainImgMut = useMutation(removeProjectMainImgOpts(id));
    const deleteGalleryImgMut = useMutation(removeFromProjectGalleryOpts(id));
    const deleteAmenityMut = useMutation(deleteProjectAmenityOpts(id));
    const deleteAvailabilityMut = useMutation(removeProjectAvailabilityOpts(id));
    const deleteDocMut = useMutation(removeProjectDocOpts(id));

    const isDeleting =
        deleteMainImgMut.isPending ||
        deleteGalleryImgMut.isPending ||
        deleteAmenityMut.isPending ||
        deleteAvailabilityMut.isPending ||
        deleteDocMut.isPending;

    const form = useForm({
        defaultValues: projectToFormValues(project),
        validators: { onChange: ProjectFormSchema },
        onSubmit: async ({ value }) => {
            try {
                await updateMut.mutateAsync(buildProjectPayload(value));
                toast.success("Proyecto actualizado", { closeButton: true });

                if (value.mainImg) {
                    try {
                        await mainImgMut.mutateAsync({
                            projectId: id,
                            file: value.mainImg,
                        });
                    } catch (e: any) {
                        toast.warning(
                            `Se actualizó el proyecto, pero falló la imagen principal: ${e?.message || ""}`,
                            { closeButton: true },
                        );
                    }
                }

                if (value.availabilityImg) {
                    try {
                        await availabilityMut.mutateAsync({
                            projectId: id,
                            file: value.availabilityImg,
                        });
                    } catch (e: any) {
                        toast.warning(
                            `Se actualizó el proyecto, pero falló el plano de disponibilidad: ${e?.message || ""}`,
                            { closeButton: true },
                        );
                    }
                }

                if (value.gallery.length > 0) {
                    try {
                        await galleryMut.mutateAsync({
                            projectId: id,
                            files: value.gallery,
                        });
                    } catch (e: any) {
                        toast.warning(
                            `Se actualizó el proyecto, pero falló la galería: ${e?.message || ""}`,
                            { closeButton: true },
                        );
                    }
                }

                for (const amenity of value.amenities) {
                    try {
                        await amenityMut.mutateAsync({
                            projectId: id,
                            name: amenity.name,
                            icon: amenity.icon,
                            file: amenity.file,
                        });
                    } catch (e: any) {
                        toast.warning(
                            `Falló al subir la amenidad "${amenity.name}": ${e?.message || ""}`,
                            { closeButton: true },
                        );
                    }
                }

                for (const doc of value.docs) {
                    if (!doc.file) continue;
                    try {
                        await docMut.mutateAsync({
                            projectId: id,
                            file: doc.file,
                            filename: doc.name,
                            description: doc.description,
                        });
                    } catch (e: any) {
                        toast.warning(
                            `Falló al subir el documento "${doc.name}": ${e?.message || ""}`,
                            { closeButton: true },
                        );
                    }
                }
            } catch (e: any) {
                toast.error(e?.message || "Error al actualizar el proyecto", {
                    closeButton: true,
                });
            }
        },
    });

    function handleDeleteMainImg() {
        deleteMainImgMut.mutate(undefined, {
            onSuccess: () =>
                toast.success("Imagen principal eliminada", {
                    closeButton: true,
                }),
            onError: (e: any) =>
                toast.error(
                    e?.message || "Error al eliminar la imagen principal",
                    { closeButton: true },
                ),
        });
    }

    function handleDeleteAvailabilityImg() {
        deleteAvailabilityMut.mutate(undefined, {
            onSuccess: () =>
                toast.success("Plano de disponibilidad eliminado", {
                    closeButton: true,
                }),
            onError: (e: any) =>
                toast.error(
                    e?.message ||
                        "Error al eliminar el plano de disponibilidad",
                    { closeButton: true },
                ),
        });
    }

    function handleDeleteGalleryImg(imgId: string) {
        deleteGalleryImgMut.mutate(
            { projectId: id, imgId },
            {
                onSuccess: () =>
                    toast.success("Imagen eliminada", { closeButton: true }),
                onError: (e: any) =>
                    toast.error(
                        e?.message || "Error al eliminar la imagen",
                        { closeButton: true },
                    ),
            },
        );
    }

    function handleDeleteAmenity(amenityId: string) {
        deleteAmenityMut.mutate(
            { projectId: id, amenityId },
            {
                onSuccess: () =>
                    toast.success("Amenidad eliminada", { closeButton: true }),
                onError: (e: any) =>
                    toast.error(
                        e?.message || "Error al eliminar la amenidad",
                        { closeButton: true },
                    ),
            },
        );
    }

    function handleDeleteDoc(docId: string) {
        deleteDocMut.mutate(
            { projectId: id, docId },
            {
                onSuccess: () =>
                    toast.success("Documento eliminado", { closeButton: true }),
                onError: (e: any) =>
                    toast.error(
                        e?.message || "Error al eliminar el documento",
                        { closeButton: true },
                    ),
            },
        );
    }

    return (
        <main className="bg-surface min-h-screen w-full p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-1.5">
                        <span className="text-primary text-xs font-semibold tracking-widest uppercase">
                            Gestión de proyectos
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Editar proyecto
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Modifica los detalles del proyecto.
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
                                form="edit-project-form"
                                disabled={!canSubmit || isSubmitting}
                            >
                                <Save className="size-4" />
                                {isSubmitting ? "Guardando..." : "Guardar"}
                            </Button>
                        )}
                    </form.Subscribe>
                </header>

                <form
                    id="edit-project-form"
                    className="space-y-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <MainInfoSection form={form} />
                    <LocationSection form={form} />

                    <ExistingImagesSection
                        project={project}
                        onDeleteMainImg={handleDeleteMainImg}
                        onDeleteAvailabilityImg={handleDeleteAvailabilityImg}
                        onDeleteGalleryImg={handleDeleteGalleryImg}
                        isDeleting={isDeleting}
                    />
                    <MediaSection form={form} />

                    <ExistingAmenitiesSection
                        project={project}
                        onDeleteAmenity={handleDeleteAmenity}
                        isDeleting={isDeleting}
                    />
                    <AmenitiesSection form={form} />

                    <ExistingDocsSection
                        docs={docs}
                        onDeleteDoc={handleDeleteDoc}
                        isDeleting={isDeleting}
                    />
                    <DocsSection form={form} />

                    <AppealSection form={form} />
                </form>
            </div>
        </main>
    );
}

function ExistingImagesSection({
    project,
    onDeleteMainImg,
    onDeleteAvailabilityImg,
    onDeleteGalleryImg,
    isDeleting,
}: {
    project: TProject;
    onDeleteMainImg: () => void;
    onDeleteAvailabilityImg: () => void;
    onDeleteGalleryImg: (imgId: string) => void;
    isDeleting: boolean;
}) {
    const hasMainImg = !!project.main_img;
    const hasAvailability = !!project.availability_img;
    const hasGallery = project.gallery && project.gallery.length > 0;

    if (!hasMainImg && !hasAvailability && !hasGallery) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Medios actuales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {hasMainImg && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Imagen principal</p>
                        <div className="group relative aspect-video w-full overflow-hidden rounded-lg">
                            <ProjectImage
                                projName={project.name}
                                src={project.main_img}
                                className="h-full w-full object-cover"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                disabled={isDeleting}
                                onClick={onDeleteMainImg}
                                className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
                {hasAvailability && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            Plano de disponibilidad
                        </p>
                        <div className="group relative aspect-video w-full overflow-hidden rounded-lg">
                            <ProjectImage
                                projName={project.name}
                                src={project.availability_img}
                                className="h-full w-full object-cover"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                disabled={isDeleting}
                                onClick={onDeleteAvailabilityImg}
                                className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
                {hasGallery && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Galería</p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {project.gallery.map((img) => (
                                <div
                                    key={img}
                                    className="group relative aspect-square overflow-hidden rounded-md border"
                                >
                                    <ProjectImage
                                        projName={project.name}
                                        src={img}
                                        className="h-full w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() =>
                                            onDeleteGalleryImg(img)
                                        }
                                        className="bg-background/80 text-destructive absolute top-2 right-2 rounded p-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ExistingAmenitiesSection({
    project,
    onDeleteAmenity,
    isDeleting,
}: {
    project: TProject;
    onDeleteAmenity: (amenityId: string) => void;
    isDeleting: boolean;
}) {
    if (!project.amenities || project.amenities.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Amenidades actuales</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {project.amenities.map((amenity) => (
                        <div
                            key={amenity.id}
                            className="group relative overflow-hidden rounded-md border p-3"
                        >
                            {amenity.img && (
                                <ProjectImage
                                    projName={project.name}
                                    src={amenity.img}
                                    className="mb-2 aspect-square w-full rounded object-cover"
                                />
                            )}
                            <div className="flex items-center gap-2">
                                {amenity.icon && (
                                    <LucideIcon
                                        name={amenity.icon}
                                        className="text-muted-foreground size-4 shrink-0"
                                    />
                                )}
                                <span className="truncate text-sm font-medium">
                                    {amenity.name}
                                </span>
                            </div>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => onDeleteAmenity(amenity.id)}
                                className="bg-background/80 text-destructive absolute top-2 right-2 rounded p-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function ExistingDocsSection({
    docs,
    onDeleteDoc,
    isDeleting,
}: {
    docs: TProjectDoc[];
    onDeleteDoc: (docId: string) => void;
    isDeleting: boolean;
}) {
    if (!docs || docs.length === 0) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Documentos actuales</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="divide-y">
                    {docs.map((doc) => (
                        <div
                            key={doc.id}
                            className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                        >
                            <FileText className="text-muted-foreground size-5 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {doc.name}
                                </p>
                                {doc.description && (
                                    <p className="text-muted-foreground truncate text-xs">
                                        {doc.description}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => onDeleteDoc(doc.id)}
                                className="text-destructive rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
