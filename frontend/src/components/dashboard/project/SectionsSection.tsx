import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadProjectSectionImage } from "@/queries/projects";
import { ProjectImage } from "@/components/Image";
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
import { GripVertical, ImageOff, Layers, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ProjectSectionFormValue } from "./schema";
import { isSectionValid } from "./schema";

// SectionsSection renders the ordered, dnd-kit reorderable list of project
// sections inside the admin form.
//
// projectId controls whether image uploads are allowed. On the new-project
// page projectId is undefined: the file picker is hidden, no imageFile is
// stored, and only text-only sections can be created. Text+image sections
// must be edited after the project is first saved.
//
// onUploadingChange notifies the parent route whenever the in-flight upload
// count crosses zero, so the parent can disable its submit button. Drag
// reorder is also disabled while any upload is in flight to avoid races
// between the sectionIdx captured at upload time and the final array order.
export function SectionsSection({
    form,
    projectId,
    onUploadingChange,
}: {
    form: any;
    projectId?: string;
    onUploadingChange?: (uploading: boolean) => void;
}) {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    const [uploadingCount, setUploadingCount] = useState(0);
    const isAnyUploading = uploadingCount > 0;

    useEffect(() => {
        onUploadingChange?.(isAnyUploading);
    }, [isAnyUploading, onUploadingChange]);

    const incUploading = () => setUploadingCount((c) => c + 1);
    const decUploading = () => setUploadingCount((c) => Math.max(0, c - 1));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Layers className="size-5" />
                    Secciones
                </CardTitle>
                {!projectId && (
                    <p className="text-muted-foreground text-sm">
                        Guarda el proyecto para subir imágenes de secciones.
                    </p>
                )}
            </CardHeader>
            <CardContent>
                <form.Field name="sections">
                    {(field: any) => {
                        const sections = (field.state.value ?? []) as ProjectSectionFormValue[];

                        const setSections = (next: ProjectSectionFormValue[]) => field.handleChange(next);

                        const addSection = () => {
                            const blank: ProjectSectionFormValue = {
                                id: undefined,
                                title: "",
                                body: "",
                                image: "",
                                imageFile: undefined,
                                image_side: "right",
                            };
                            setSections([...sections, blank]);
                        };

                        const updateAt = (idx: number, patch: Partial<ProjectSectionFormValue>) => {
                            const next = sections.slice();
                            next[idx] = { ...next[idx], ...patch };
                            setSections(next);
                        };

                        const removeAt = (idx: number) => {
                            setSections(sections.filter((_, i) => i !== idx));
                        };

                        const onDragEnd = (e: DragEndEvent) => {
                            const { active, over } = e;
                            if (!over || active.id === over.id) return;
                            const oldIdx = sections.findIndex((_, i) => keyOf(sections[i], i) === active.id);
                            const newIdx = sections.findIndex((_, i) => keyOf(sections[i], i) === over.id);
                            if (oldIdx < 0 || newIdx < 0) return;
                            setSections(arrayMove(sections, oldIdx, newIdx));
                        };

                        const ids = sections.map((s, i) => keyOf(s, i));

                        return (
                            <div className="space-y-4">
                                {sections.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        Aún no hay secciones. Agrega una para describir el proyecto en bloques.
                                    </p>
                                ) : (
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                                        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                                            <ul className="space-y-3">
                                                {sections.map((s, idx) => (
                                                    <SortableSectionCard
                                                        key={ids[idx]}
                                                        id={ids[idx]}
                                                        idx={idx}
                                                        section={s}
                                                        projectId={projectId}
                                                        disableDrag={isAnyUploading}
                                                        incUploading={incUploading}
                                                        decUploading={decUploading}
                                                        onChange={(patch) => updateAt(idx, patch)}
                                                        onRemove={() => removeAt(idx)}
                                                    />
                                                ))}
                                            </ul>
                                        </SortableContext>
                                    </DndContext>
                                )}

                                <Button type="button" variant="outline" onClick={addSection}>
                                    <Plus className="size-4" />
                                    Agregar sección
                                </Button>

                                <FieldError errors={errsOf(field)} />
                            </div>
                        );
                    }}
                </form.Field>
            </CardContent>
        </Card>
    );
}

function keyOf(s: ProjectSectionFormValue, idx: number): string {
    return s.id && s.id !== "" ? `id:${s.id}` : `idx:${idx}`;
}

type ErrorList = Array<{ message?: string } | undefined>;

function errsOf(field: { state: { meta: { errors: unknown } } }) {
    return field.state.meta.errors as unknown as ErrorList;
}

function SortableSectionCard({
    id,
    idx,
    section,
    projectId,
    disableDrag,
    incUploading,
    decUploading,
    onChange,
    onRemove,
}: {
    id: string;
    idx: number;
    section: ProjectSectionFormValue;
    projectId?: string;
    disableDrag: boolean;
    incUploading: () => void;
    decUploading: () => void;
    onChange: (patch: Partial<ProjectSectionFormValue>) => void;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled: disableDrag,
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const canUpload = !!projectId;
    const hasText = section.body.trim() !== "";
    const hasImage = section.image.trim() !== "";
    const showSideToggle = hasText && hasImage;
    const valid = isSectionValid(section);

    const handleFile = async (file: File) => {
        if (!projectId) return; // Guard: caller should not invoke without projectId.
        setUploading(true);
        incUploading();
        try {
            const res = await uploadProjectSectionImage({ projectId, sectionIdx: idx, file });
            onChange({ image: res.filename, imageFile: undefined });
            toast.success("Imagen de sección subida");
        } catch (e: any) {
            toast.error(e?.message || "Error al subir la imagen");
        } finally {
            setUploading(false);
            decUploading();
        }
    };

    const clearImage = () => {
        onChange({ image: "", imageFile: undefined });
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className="border-outline-variant/30 bg-surface-container-low rounded-lg border"
        >
            <div className="flex items-stretch">
                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground flex w-10 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ cursor: disableDrag ? "not-allowed" : "grab" }}
                    aria-label={`Reordenar sección ${idx + 1}`}
                    disabled={disableDrag}
                    {...(disableDrag ? {} : attributes)}
                    {...(disableDrag ? {} : listeners)}
                >
                    <GripVertical className="size-5" />
                </button>

                <div className="flex-1 space-y-4 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest">
                            Sección {idx + 1}
                        </p>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onRemove}
                            aria-label="Eliminar sección"
                        >
                            <Trash2 className="size-4" />
                            Eliminar
                        </Button>
                    </div>

                    <Field>
                        <FieldLabel htmlFor={`section-title-${idx}`}>Título</FieldLabel>
                        <Input
                            id={`section-title-${idx}`}
                            value={section.title}
                            onChange={(e) => onChange({ title: e.target.value })}
                            placeholder="Título de la sección (opcional)"
                            maxLength={200}
                        />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor={`section-body-${idx}`}>Texto</FieldLabel>
                        <Textarea
                            id={`section-body-${idx}`}
                            rows={4}
                            value={section.body}
                            onChange={(e) => onChange({ body: e.target.value })}
                            placeholder="Separa párrafos con doble salto de línea."
                        />
                    </Field>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Imagen</p>

                        {canUpload ? (
                            <>
                                {section.image && (
                                    <div className="relative aspect-video w-full overflow-hidden rounded-md">
                                        <ProjectImage
                                            projName="Sección"
                                            src={section.image}
                                            className="h-full w-full object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute right-2 top-2"
                                            onClick={clearImage}
                                            disabled={uploading}
                                        >
                                            <ImageOff className="size-4" />
                                            Quitar imagen
                                        </Button>
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleFile(f);
                                        e.target.value = "";
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="size-4" />
                                    {uploading
                                        ? "Subiendo..."
                                        : section.image
                                          ? "Reemplazar imagen"
                                          : "Subir imagen"}
                                </Button>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-xs">
                                Guarda el proyecto para subir imágenes de secciones.
                            </p>
                        )}
                    </div>

                    {showSideToggle && (
                        <Field>
                            <FieldLabel>Posición de la imagen</FieldLabel>
                            <div className="flex gap-2">
                                {(["left", "right"] as const).map((side) => {
                                    const active = section.image_side === side;
                                    return (
                                        <Button
                                            key={side}
                                            type="button"
                                            variant={active ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => onChange({ image_side: side })}
                                        >
                                            {side === "left" ? "Izquierda" : "Derecha"}
                                        </Button>
                                    );
                                })}
                            </div>
                        </Field>
                    )}

                    {!valid && (
                        <p className="text-destructive text-xs">
                            La sección debe tener texto o imagen.
                        </p>
                    )}
                </div>
            </div>
        </li>
    );
}
