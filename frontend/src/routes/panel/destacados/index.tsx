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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FEATURED_KINDS,
    featuredImageSrc,
    featuredKindLabel,
    createFeaturedItemOpts,
    deleteFeaturedItemOpts,
    getAdminFeaturedContentOpts,
    reorderFeaturedItemsOpts,
    updateFeaturedConfigOpts,
    updateFeaturedItemOpts,
    uploadFeaturedImage,
    type TFeaturedItem,
    type TFeaturedItemInput,
    type TFeaturedKind,
    type TResolvedFeaturedItem,
} from "@/queries/featured";
import { getAdminBlogPostsOpts } from "@/queries/blog";
import { getProjectsOpts } from "@/queries/projects";
import { getPropertyFilteredListingOpts } from "@/queries/properties";
import { listSellingPagesOpts } from "@/queries/sellingPages";
import { FormatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
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
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
    GripVertical,
    ImageOff,
    Pencil,
    Plus,
    Trash2,
    TriangleAlert,
    Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/** Per-kind clarification for the delete confirmation: removing a featured
 * card never deletes the linked resource itself. */
const FEATURED_KIND_DELETE_NOTES: Record<TFeaturedKind, string> = {
    property: "La propiedad vinculada no se eliminará.",
    project: "El proyecto vinculado no se eliminará.",
    selling_page: "La página de venta vinculada no se eliminará.",
    blog_post: "El artículo del blog vinculado no se eliminará.",
    external: "Solo se quitará el enlace de esta sección.",
};

export const Route = createFileRoute("/panel/destacados/")({
    component: RouteComponent,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(getAdminFeaturedContentOpts);
    },
});

function RouteComponent() {
    const { data, isLoading } = useQuery(getAdminFeaturedContentOpts);
    const items = data?.items ?? [];
    const resolvedById = useMemo(() => {
        const map = new Map<string, TResolvedFeaturedItem>();
        for (const r of data?.resolved ?? []) map.set(r.id, r);
        return map;
    }, [data?.resolved]);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<TFeaturedItem | null>(null);

    function openCreate() {
        setEditing(null);
        setDialogOpen(true);
    }

    function openEdit(item: TFeaturedItem) {
        setEditing(item);
        setDialogOpen(true);
    }

    return (
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Contenido destacado</h1>
                    <p className="text-muted-foreground text-sm">
                        Administra las tarjetas destacadas de la página de inicio: propiedades,
                        proyectos, páginas de venta, artículos del blog o enlaces externos.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="size-4" /> Agregar destacado
                </Button>
            </div>

            <VisibleCountCard visibleCount={data?.visibleCount ?? 3} />

            {isLoading ? (
                <p className="text-muted-foreground">Cargando…</p>
            ) : items.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No hay contenido destacado. Agrega el primero.
                    </CardContent>
                </Card>
            ) : (
                <FeaturedSortableList
                    items={items}
                    resolvedById={resolvedById}
                    onEdit={openEdit}
                />
            )}

            <FeaturedItemDialog
                key={editing?.id ?? "new"}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editing={editing}
            />
        </main>
    );
}

function VisibleCountCard({ visibleCount }: { visibleCount: number }) {
    const [count, setCount] = useState(visibleCount);
    useEffect(() => setCount(visibleCount), [visibleCount]);
    const configMut = useMutation(updateFeaturedConfigOpts());

    async function onSave() {
        try {
            await configMut.mutateAsync(count);
            toast.success("Configuración guardada", { closeButton: true });
        } catch (e: any) {
            toast.error(e?.message || "Error", { closeButton: true });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Tarjetas visibles</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4">
                <Field className="w-40">
                    <FieldLabel htmlFor="visible-count">Cantidad</FieldLabel>
                    <Input
                        id="visible-count"
                        type="number"
                        min={1}
                        max={24}
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                    />
                </Field>
                <p className="text-muted-foreground text-sm flex-1 min-w-60">
                    Las tarjetas que excedan esta cantidad se mostrarán dentro de una sección
                    colapsable ("Ver más destacados") para no alargar la página de inicio.
                </p>
                <Button onClick={onSave} disabled={configMut.isPending || count < 1}>
                    Guardar
                </Button>
            </CardContent>
        </Card>
    );
}

function FeaturedSortableList({
    items,
    resolvedById,
    onEdit,
}: {
    items: TFeaturedItem[];
    resolvedById: Map<string, TResolvedFeaturedItem>;
    onEdit: (item: TFeaturedItem) => void;
}) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    );
    const [order, setOrder] = useState(() => items.map((i) => i.id));
    useEffect(() => setOrder(items.map((i) => i.id)), [items]);

    const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
    const reorderMut = useMutation(reorderFeaturedItemsOpts());

    async function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = order.indexOf(String(active.id));
        const newIndex = order.indexOf(String(over.id));
        const newOrder = arrayMove(order, oldIndex, newIndex);
        setOrder(newOrder);

        try {
            await reorderMut.mutateAsync(newOrder);
        } catch (e: any) {
            setOrder(items.map((i) => i.id));
            toast.error(e?.message || "No se pudo guardar el orden", { closeButton: true });
        }
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 gap-3">
                    {order.map((id) => {
                        const item = itemsById.get(id);
                        if (!item) return null;
                        return (
                            <SortableFeaturedRow
                                key={id}
                                item={item}
                                resolved={resolvedById.get(id)}
                                onEdit={() => onEdit(item)}
                            />
                        );
                    })}
                </div>
            </SortableContext>
        </DndContext>
    );
}

function SortableFeaturedRow({
    item,
    resolved,
    onEdit,
}: {
    item: TFeaturedItem;
    resolved?: TResolvedFeaturedItem;
    onEdit: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({
            id: item.id,
        });
    const deleteMut = useMutation(deleteFeaturedItemOpts());

    async function onDelete() {
        try {
            await deleteMut.mutateAsync(item.id);
            toast.success("Destacado eliminado", { closeButton: true });
        } catch (e: any) {
            toast.error(e?.message || "Error", { closeButton: true });
        }
    }

    const cardName =
        resolved?.title || item.title || item.externalUrl || featuredKindLabel(item.kind);

    const imageSrc = featuredImageSrc(resolved?.image ?? item.image);

    return (
        <Card
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(isDragging && "opacity-70 relative z-10")}
        >
            <CardContent className="flex flex-wrap items-center gap-4 py-3">
                <button
                    type="button"
                    className="text-muted-foreground cursor-grab touch-none"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="size-5" />
                </button>

                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted grid place-items-center">
                    {imageSrc ? (
                        <img src={imageSrc} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <ImageOff className="size-5 text-muted-foreground" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                            {resolved?.title || item.title || item.externalUrl}
                        </span>
                        <Badge variant="outline">{featuredKindLabel(item.kind)}</Badge>
                        {!resolved && item.kind !== "external" && (
                            <Badge variant="destructive" className="gap-1">
                                <TriangleAlert className="size-3" /> No disponible
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm truncate">
                        {resolved?.external
                            ? resolved.href
                            : resolved?.subtitle ||
                              resolved?.href ||
                              "El recurso vinculado ya no está publicado; la tarjeta no se mostrará."}
                    </p>
                </div>

                <Button variant="outline" size="sm" onClick={onEdit}>
                    <Pencil className="size-4" /> Editar
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={deleteMut.isPending}>
                            <Trash2 className="size-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Quitar de destacados?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Se quitará la tarjeta "{cardName}" de la sección de destacados
                                de la página de inicio. {FEATURED_KIND_DELETE_NOTES[item.kind]}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={onDelete}>
                                Quitar destacado
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

function FeaturedItemDialog({
    open,
    onOpenChange,
    editing,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: TFeaturedItem | null;
}) {
    const [kind, setKind] = useState<TFeaturedKind>(editing?.kind ?? "property");
    const [resourceId, setResourceId] = useState(editing?.resourceId ?? "");
    const [externalUrl, setExternalUrl] = useState(editing?.externalUrl ?? "");
    const [title, setTitle] = useState(editing?.title ?? "");
    const [subtitle, setSubtitle] = useState(editing?.subtitle ?? "");
    const [image, setImage] = useState(editing?.image ?? "");
    const [uploading, setUploading] = useState(false);

    const createMut = useMutation(createFeaturedItemOpts());
    const updateMut = useMutation(updateFeaturedItemOpts(editing?.id ?? ""));
    const isPending = createMut.isPending || updateMut.isPending;

    function onKindChange(next: TFeaturedKind) {
        setKind(next);
        setResourceId("");
    }

    async function onImageFile(file: File | undefined) {
        if (!file) return;
        setUploading(true);
        try {
            const res = await uploadFeaturedImage(file);
            setImage(res.filename);
        } catch (e: any) {
            toast.error(e?.message || "No se pudo subir la imagen", { closeButton: true });
        } finally {
            setUploading(false);
        }
    }

    async function onSubmit() {
        const input: TFeaturedItemInput = {
            kind,
            resourceId,
            externalUrl,
            title,
            subtitle,
            image,
        };
        try {
            if (editing) {
                await updateMut.mutateAsync(input);
                toast.success("Destacado actualizado", { closeButton: true });
            } else {
                await createMut.mutateAsync(input);
                toast.success("Destacado agregado", { closeButton: true });
            }
            onOpenChange(false);
        } catch (e: any) {
            toast.error(e?.message || "Error", { closeButton: true });
        }
    }

    const needsResource = kind !== "external";
    const canSubmit = needsResource
        ? resourceId !== ""
        : externalUrl !== "" && title !== "" && image !== "";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? "Editar destacado" : "Agregar destacado"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <Field>
                        <FieldLabel>Tipo de contenido</FieldLabel>
                        <Select
                            value={kind}
                            onValueChange={(v) => onKindChange(v as TFeaturedKind)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FEATURED_KINDS.map((k) => (
                                    <SelectItem key={k.value} value={k.value}>
                                        {k.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    {kind === "property" && (
                        <PropertyPicker value={resourceId} onChange={setResourceId} />
                    )}
                    {kind === "project" && (
                        <ProjectPicker value={resourceId} onChange={setResourceId} />
                    )}
                    {kind === "selling_page" && (
                        <SellingPagePicker value={resourceId} onChange={setResourceId} />
                    )}
                    {kind === "blog_post" && (
                        <BlogPostPicker value={resourceId} onChange={setResourceId} />
                    )}
                    {kind === "external" && (
                        <Field>
                            <FieldLabel htmlFor="featured-url">Enlace</FieldLabel>
                            <Input
                                id="featured-url"
                                type="url"
                                placeholder="https://ejemplo.com"
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                            />
                        </Field>
                    )}

                    <Field>
                        <FieldLabel htmlFor="featured-title">
                            Título{" "}
                            {needsResource && (
                                <span className="text-muted-foreground">
                                    (opcional, reemplaza el del recurso)
                                </span>
                            )}
                        </FieldLabel>
                        <Input
                            id="featured-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="featured-subtitle">
                            Subtítulo <span className="text-muted-foreground">(opcional)</span>
                        </FieldLabel>
                        <Input
                            id="featured-subtitle"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                        />
                    </Field>

                    <Field>
                        <FieldLabel>
                            Imagen{" "}
                            {needsResource && (
                                <span className="text-muted-foreground">
                                    (opcional, reemplaza la del recurso)
                                </span>
                            )}
                        </FieldLabel>
                        <div className="flex items-center gap-3">
                            {image ? (
                                <img
                                    src={featuredImageSrc(image)}
                                    alt=""
                                    className="h-14 w-20 rounded-md object-cover"
                                />
                            ) : (
                                <div className="h-14 w-20 rounded-md bg-muted grid place-items-center">
                                    <ImageOff className="size-5 text-muted-foreground" />
                                </div>
                            )}
                            <Button asChild variant="outline" size="sm" disabled={uploading}>
                                <label className="cursor-pointer">
                                    <Upload className="size-4" />
                                    {uploading ? "Subiendo…" : "Subir imagen"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => onImageFile(e.target.files?.[0])}
                                    />
                                </label>
                            </Button>
                            {image && (
                                <Button variant="ghost" size="sm" onClick={() => setImage("")}>
                                    Quitar
                                </Button>
                            )}
                        </div>
                    </Field>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={onSubmit} disabled={!canSubmit || isPending || uploading}>
                        {editing ? "Guardar cambios" : "Agregar"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function PropertyPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (id: string) => void;
}) {
    const [search, setSearch] = useState("");
    const { data, isFetching } = useQuery(
        getPropertyFilteredListingOpts({
            textSearch: search || undefined,
            perPage: 8,
            page: 1,
        }),
    );
    const properties = data?.properties ?? [];

    return (
        <Field>
            <FieldLabel htmlFor="featured-property-search">Propiedad</FieldLabel>
            <Input
                id="featured-property-search"
                placeholder="Buscar por dirección, título…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <div className="mt-2 max-h-56 overflow-y-auto rounded-md border divide-y">
                {properties.length === 0 ? (
                    <p className="text-muted-foreground p-3 text-sm">
                        {isFetching ? "Buscando…" : "Sin resultados"}
                    </p>
                ) : (
                    properties.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => onChange(p.id)}
                            className={cn(
                                "hover:bg-muted block w-full px-3 py-2 text-left text-sm",
                                value === p.id && "bg-muted font-medium",
                            )}
                        >
                            <span className="block truncate">{p.title || p.address}</span>
                            <span className="text-muted-foreground block truncate text-xs">
                                {FormatMoney(p.price)} · {p.address}
                            </span>
                        </button>
                    ))
                )}
            </div>
        </Field>
    );
}

function ResourceSelect({
    label,
    value,
    onChange,
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (id: string) => void;
    options: { id: string; label: string; hint?: string }[];
    placeholder: string;
}) {
    return (
        <Field>
            <FieldLabel>{label}</FieldLabel>
            <Select value={value || undefined} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                            {o.label}
                            {o.hint ? ` — ${o.hint}` : ""}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Field>
    );
}

function ProjectPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
    const { data } = useQuery(getProjectsOpts);
    const options = (data?.projects ?? []).map((p) => ({ id: p.id, label: p.name }));
    return (
        <ResourceSelect
            label="Proyecto"
            value={value}
            onChange={onChange}
            options={options}
            placeholder="Selecciona un proyecto"
        />
    );
}

function SellingPagePicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (id: string) => void;
}) {
    const { data } = useQuery(listSellingPagesOpts());
    const options = (data?.pages ?? []).map((p) => ({
        id: p.id,
        label: p.name,
        hint: p.published ? undefined : "borrador",
    }));
    return (
        <ResourceSelect
            label="Página de venta"
            value={value}
            onChange={onChange}
            options={options}
            placeholder="Selecciona una página"
        />
    );
}

function BlogPostPicker({
    value,
    onChange,
}: {
    value: string;
    onChange: (id: string) => void;
}) {
    const { data } = useQuery(getAdminBlogPostsOpts({ status: "published", limit: 50 }));
    const options = (data?.posts ?? []).map((p) => ({ id: p.id, label: p.title }));
    return (
        <ResourceSelect
            label="Artículo del blog"
            value={value}
            onChange={onChange}
            options={options}
            placeholder="Selecciona un artículo"
        />
    );
}
