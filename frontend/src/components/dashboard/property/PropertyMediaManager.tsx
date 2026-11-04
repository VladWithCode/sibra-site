import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { stillSrc, type TMediaAsset } from "@/lib/media";
import { cn } from "@/lib/utils";
import {
    MEDIA_ACCEPT,
    MEDIA_LIMITS,
    checkMediaFile,
    deletePropertyMainImageOpts,
    deletePropertyMediaOpts,
    getPropertyMediaOpts,
    reorderPropertyMediaOpts,
    setPropertyCoverOpts,
    uploadPropertyMainImage,
    uploadPropertyMediaFile,
} from "@/queries/propertyMedia";
import type { TPropertyMedia } from "@/queries/type";
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    AlertCircle,
    CloudUpload,
    GripVertical,
    Loader2,
    Play,
    Star,
    Trash2,
    X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type UploadJob = {
    key: string;
    name: string;
    progress: number;
    error?: string;
};

function formatDuration(ms?: number) {
    if (!ms) return "";
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Runs uploads one at a time and tracks their progress. */
function useUploadQueue() {
    const [jobs, setJobs] = useState<UploadJob[]>([]);
    const update = (key: string, patch: Partial<UploadJob>) =>
        setJobs((js) => js.map((j) => (j.key === key ? { ...j, ...patch } : j)));

    async function run(
        files: File[],
        allowVideo: boolean,
        upload: (file: File, onProgress: (f: number) => void) => Promise<unknown>,
    ) {
        const queued = files.map((f, i) => ({
            file: f,
            job: { key: `${Date.now()}-${i}-${f.name}`, name: f.name, progress: 0 },
        }));
        setJobs((js) => [...js, ...queued.map((q) => q.job)]);
        for (const { file, job } of queued) {
            const problem = await checkMediaFile(file, allowVideo);
            if (problem) {
                update(job.key, { error: problem });
                continue;
            }
            try {
                await upload(file, (progress) => update(job.key, { progress }));
                setJobs((js) => js.filter((j) => j.key !== job.key));
            } catch (e: any) {
                update(job.key, { error: e?.message || "No se pudo subir el archivo" });
            }
        }
    }

    const dismiss = (key: string) => setJobs((js) => js.filter((j) => j.key !== key));
    return { jobs, run, dismiss };
}

function StatusOverlay({ asset }: { asset: TMediaAsset }) {
    if (asset.status === "ready") return null;
    if (asset.status === "failed") {
        return (
            <div className="bg-destructive/90 text-destructive-foreground absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center text-xs">
                <AlertCircle className="size-5" />
                <span>{asset.error || "Error al procesar"}</span>
            </div>
        );
    }
    return (
        <div className="bg-surface-container-high/90 text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-1 text-xs">
            <Loader2 className="size-5 animate-spin" />
            <span>Procesando{asset.kind === "video" ? " video" : ""}…</span>
        </div>
    );
}

function Still({
    asset,
    alt,
    className,
}: {
    asset: TMediaAsset;
    alt: string;
    className?: string;
}) {
    if (asset.status !== "ready")
        return <div className={cn("bg-surface-container", className)} />;
    return <img src={stillSrc(asset, 480)} alt={alt} loading="lazy" className={className} />;
}

function ConfirmDelete({
    title,
    onConfirm,
    disabled,
    className,
}: {
    title: string;
    onConfirm: () => void;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    aria-label={title}
                    className={cn(
                        "bg-background/85 text-destructive rounded p-1 backdrop-blur",
                        className,
                    )}
                >
                    <Trash2 className="size-4" />
                </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function SortableTile({ item, propertyId }: { item: TPropertyMedia; propertyId: string }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({
            id: item.id,
        });
    const coverMut = useMutation(setPropertyCoverOpts(propertyId));
    const deleteMut = useMutation(deletePropertyMediaOpts(propertyId));
    const isVideo = item.asset.kind === "video";

    const toggleCover = () =>
        coverMut.mutate(
            { mediaId: item.id, isCover: !item.isCover },
            { onError: (e: any) => toast.error(e?.message || "Error", { closeButton: true }) },
        );
    const remove = () =>
        deleteMut.mutate(item.id, {
            onError: (e: any) => toast.error(e?.message || "Error", { closeButton: true }),
        });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(
                "group bg-surface-container relative aspect-square overflow-hidden rounded-md border",
                item.isCover && "ring-primary ring-2 ring-offset-2",
                isDragging && "z-10 opacity-70",
            )}
        >
            <Still
                asset={item.asset}
                alt={isVideo ? "Video" : "Foto"}
                className="h-full w-full object-cover"
            />
            <StatusOverlay asset={item.asset} />

            <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Arrastrar para ordenar"
                className="bg-background/85 absolute top-2 left-2 cursor-grab rounded p-1 backdrop-blur active:cursor-grabbing"
            >
                <GripVertical className="size-4" />
            </button>
            <ConfirmDelete
                title={isVideo ? "¿Eliminar este video?" : "¿Eliminar esta foto?"}
                onConfirm={remove}
                disabled={deleteMut.isPending}
                className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            />

            {isVideo && (
                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
                    <span className="bg-foreground/70 text-background flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium">
                        <Play className="size-3" />
                        {formatDuration(item.asset.durationMs)}
                    </span>
                    <button
                        type="button"
                        onClick={toggleCover}
                        disabled={coverMut.isPending}
                        aria-pressed={item.isCover}
                        title="La portada se reproduce en la sección de destacados del inicio"
                        className={cn(
                            "flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium backdrop-blur",
                            item.isCover
                                ? "bg-primary text-primary-foreground"
                                : "bg-background/85 text-foreground",
                        )}
                    >
                        <Star className={cn("size-3", item.isCover && "fill-current")} />
                        {item.isCover ? "Portada" : "Usar de portada"}
                    </button>
                </div>
            )}
        </div>
    );
}

function GalleryGrid({ propertyId, media }: { propertyId: string; media: TPropertyMedia[] }) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    );
    const [order, setOrder] = useState(() => media.map((m) => m.id));
    useEffect(() => setOrder(media.map((m) => m.id)), [media]);
    const byId = useMemo(() => new Map(media.map((m) => [m.id, m])), [media]);
    const reorderMut = useMutation(reorderPropertyMediaOpts(propertyId));

    function onDragEnd({ active, over }: DragEndEvent) {
        if (!over || active.id === over.id) return;
        const next = arrayMove(
            order,
            order.indexOf(String(active.id)),
            order.indexOf(String(over.id)),
        );
        setOrder(next);
        reorderMut.mutate(next, {
            onError: (e: any) => {
                setOrder(media.map((m) => m.id));
                toast.error(e?.message || "No se pudo guardar el orden", { closeButton: true });
            },
        });
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={order} strategy={rectSortingStrategy}>
                {order.map((id) => {
                    const item = byId.get(id);
                    return item ? (
                        <SortableTile key={id} item={item} propertyId={propertyId} />
                    ) : null;
                })}
            </SortableContext>
        </DndContext>
    );
}

function UploadJobs({
    jobs,
    onDismiss,
}: {
    jobs: UploadJob[];
    onDismiss: (key: string) => void;
}) {
    if (jobs.length === 0) return null;
    return (
        <ul className="space-y-2" aria-live="polite">
            {jobs.map((j) => (
                <li key={j.key} className="rounded-md border p-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{j.name}</span>
                        {j.error ? (
                            <button
                                type="button"
                                onClick={() => onDismiss(j.key)}
                                aria-label="Descartar"
                            >
                                <X className="size-4" />
                            </button>
                        ) : (
                            <span className="text-muted-foreground tabular-nums">
                                {Math.round(j.progress * 100)}%
                            </span>
                        )}
                    </div>
                    {j.error ? (
                        <p className="text-destructive mt-1 text-xs">{j.error}</p>
                    ) : (
                        <div className="bg-surface-container mt-1.5 h-1.5 overflow-hidden rounded-full">
                            <div
                                className="bg-primary h-full transition-[width]"
                                style={{ width: `${j.progress * 100}%` }}
                            />
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}

/**
 * Main image and ordered photo/video gallery of an existing property.
 * Changes apply immediately (independent of the property form's Save):
 * files upload one by one with progress, then encode on the server while the
 * grid shows their status.
 */
export function PropertyMediaManager({ propertyId }: { propertyId: string }) {
    const { data } = useQuery(getPropertyMediaOpts(propertyId));
    const mainInput = useRef<HTMLInputElement>(null);
    const galleryInput = useRef<HTMLInputElement>(null);
    const mainQueue = useUploadQueue();
    const galleryQueue = useUploadQueue();
    const deleteMainMut = useMutation(deletePropertyMainImageOpts(propertyId));

    const media = data?.media ?? [];
    const main = data?.mainImage ?? null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Fotos y videos</CardTitle>
                <CardDescription>
                    Los cambios se guardan al instante. Los archivos se optimizan en el
                    servidor; los videos pueden tardar unos minutos en estar listos.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <section className="space-y-3">
                    <div>
                        <p className="text-sm font-medium">Imagen principal</p>
                        <p className="text-muted-foreground text-xs">
                            Se muestra en tarjetas y al inicio de la página. JPG, PNG o WebP,
                            máx 25MB.
                        </p>
                    </div>
                    <input
                        ref={mainInput}
                        type="file"
                        accept={MEDIA_LIMITS.imageTypes.join(",")}
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) {
                                mainQueue.run([file], false, (f, p) =>
                                    uploadPropertyMainImage(propertyId, f, p),
                                );
                            }
                        }}
                    />
                    {main ? (
                        <div className="group relative aspect-video w-full max-w-xl overflow-hidden rounded-lg border">
                            <Still
                                asset={main}
                                alt="Imagen principal"
                                className="h-full w-full object-cover"
                            />
                            <StatusOverlay asset={main} />
                            <div className="absolute top-2 right-2 flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => mainInput.current?.click()}
                                >
                                    Cambiar
                                </Button>
                                <ConfirmDelete
                                    title="¿Eliminar la imagen principal?"
                                    disabled={deleteMainMut.isPending}
                                    onConfirm={() =>
                                        deleteMainMut.mutate(undefined, {
                                            onError: (e: any) =>
                                                toast.error(e?.message || "Error", {
                                                    closeButton: true,
                                                }),
                                        })
                                    }
                                    className="p-2"
                                />
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => mainInput.current?.click()}
                            className="border-outline-variant/40 hover:border-primary/60 hover:bg-accent/40 flex aspect-video w-full max-w-xl flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors"
                        >
                            <CloudUpload className="text-primary size-8" />
                            <span className="text-sm font-semibold">
                                Subir imagen principal
                            </span>
                        </button>
                    )}
                    <UploadJobs jobs={mainQueue.jobs} onDismiss={mainQueue.dismiss} />
                </section>

                <section className="space-y-3">
                    <div>
                        <p className="text-sm font-medium">Galería</p>
                        <p className="text-muted-foreground text-xs">
                            Fotos (máx 25MB) y videos MP4, MOV o WebM (máx 500MB y 3 minutos).
                            Arrastra para ordenar. El video marcado como portada se reproduce en
                            la sección de destacados del inicio.
                        </p>
                    </div>
                    <input
                        ref={galleryInput}
                        type="file"
                        accept={MEDIA_ACCEPT}
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            e.target.value = "";
                            if (files.length > 0) {
                                galleryQueue.run(files, true, (f, p) =>
                                    uploadPropertyMediaFile(propertyId, f, p),
                                );
                            }
                        }}
                    />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        <GalleryGrid propertyId={propertyId} media={media} />
                        <button
                            type="button"
                            onClick={() => galleryInput.current?.click()}
                            className="border-outline-variant/40 hover:border-primary/60 text-muted-foreground hover:text-primary flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-xs transition-colors"
                        >
                            <CloudUpload className="size-6" />
                            Agregar fotos o videos
                        </button>
                    </div>
                    <UploadJobs jobs={galleryQueue.jobs} onDismiss={galleryQueue.dismiss} />
                </section>
            </CardContent>
        </Card>
    );
}
