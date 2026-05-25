import { ProjectImage } from "@/components/Image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { CloudUpload, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ErrorList = Array<{ message?: string } | undefined>;

function errsOf(field: { state: { meta: { errors: unknown } } }) {
    return field.state.meta.errors as unknown as ErrorList;
}

function useObjectUrl(file: File | undefined | null) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    return url;
}

function useObjectUrls(files: File[]) {
    const [urls, setUrls] = useState<string[]>([]);

    useEffect(() => {
        const objectUrls = files.map((f) => URL.createObjectURL(f));
        setUrls(objectUrls);
        return () => {
            objectUrls.forEach((u) => URL.revokeObjectURL(u));
        };
    }, [files]);

    return urls;
}

export function SingleImageField({
    form,
    name,
    label,
    description,
    existingSrc,
    onDeleteExisting,
    aspectClassName = "aspect-video",
}: {
    form: any;
    name: "mainImg" | "availabilityImg" | "quoteImg";
    label: string;
    description: string;
    existingSrc?: string;
    onDeleteExisting?: () => void;
    aspectClassName?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <form.Field name={name}>
            {(field: any) => {
                const file = field.state.value as File | undefined;

                // If a new file has been selected, show its preview
                if (file) {
                    return (
                        <Field>
                            <FieldLabel>{label}</FieldLabel>
                            <FieldDescription>{description}</FieldDescription>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    field.handleChange(f);
                                }}
                            />
                            <SingleImagePreview
                                file={file}
                                onRemove={() => {
                                    field.handleChange(undefined);
                                    if (inputRef.current) inputRef.current.value = "";
                                }}
                            />
                            <FieldError errors={errsOf(field)} />
                        </Field>
                    );
                }

                // If an image already exists on the server, show it with a visible delete button below
                if (existingSrc) {
                    return (
                        <Field>
                            <FieldLabel>{label}</FieldLabel>
                            <FieldDescription>{description}</FieldDescription>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    field.handleChange(f);
                                }}
                            />
                            <div className={`${aspectClassName} w-full overflow-hidden rounded-lg`}>
                                <ProjectImage
                                    projName={label}
                                    src={existingSrc}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={!onDeleteExisting}
                                onClick={onDeleteExisting}
                                className="w-full"
                            >
                                <Trash2 className="size-4 mr-2" />
                                Eliminar imagen
                            </Button>
                            <FieldError errors={errsOf(field)} />
                        </Field>
                    );
                }

                // Otherwise show the upload placeholder
                return (
                    <Field>
                        <FieldLabel>{label}</FieldLabel>
                        <FieldDescription>{description}</FieldDescription>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                field.handleChange(f);
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="border-outline-variant/40 hover:border-primary/60 hover:bg-accent/40 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors"
                        >
                            <CloudUpload className="text-primary size-8" />
                            <p className="text-sm font-semibold">Subir imagen</p>
                            <p className="text-muted-foreground text-xs">
                                Haz click o arrastra un archivo
                            </p>
                        </button>
                        <FieldError errors={errsOf(field)} />
                    </Field>
                );
            }}
        </form.Field>
    );
}

function SingleImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
    const url = useObjectUrl(file);
    return (
        <div className="group relative aspect-video w-full overflow-hidden rounded-lg">
            {url && <img src={url} alt={file.name} className="h-full w-full object-cover" />}
            <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={onRemove}
                className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
            >
                <Trash2 className="size-4" />
            </Button>
        </div>
    );
}

function GalleryField({ form }: { form: any }) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <form.Field name="gallery">
            {(field: any) => {
                const files = (field.state.value ?? []) as File[];
                return (
                    <Field>
                        <FieldLabel>Galería</FieldLabel>
                        <FieldDescription>
                            Puedes agregar varias imágenes para la galería del proyecto.
                        </FieldDescription>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                const next = Array.from(e.target.files ?? []);
                                field.handleChange([...files, ...next]);
                                if (inputRef.current) inputRef.current.value = "";
                            }}
                        />
                        <GalleryPreview
                            files={files}
                            onRemove={(idx) => {
                                const next = [...files];
                                next.splice(idx, 1);
                                field.handleChange(next);
                            }}
                            onAdd={() => inputRef.current?.click()}
                        />
                        <FieldError errors={errsOf(field)} />
                    </Field>
                );
            }}
        </form.Field>
    );
}

function GalleryPreview({
    files,
    onRemove,
    onAdd,
}: {
    files: File[];
    onRemove: (idx: number) => void;
    onAdd: () => void;
}) {
    const urls = useObjectUrls(files);
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {files.map((f, i) => (
                <div
                    key={`${f.name}-${i}`}
                    className="group relative aspect-square overflow-hidden rounded-md border"
                >
                    <img src={urls[i]} alt={f.name} className="h-full w-full object-cover" />
                    <button
                        type="button"
                        onClick={() => onRemove(i)}
                        className="bg-background/80 text-destructive absolute top-2 right-2 rounded p-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={onAdd}
                className="border-outline-variant/40 hover:border-primary/60 text-muted-foreground hover:text-primary flex aspect-square items-center justify-center rounded-md border-2 border-dashed transition-colors"
            >
                <CloudUpload className="size-6" />
            </button>
        </div>
    );
}

export function MediaSection({
    form,
    existingMainImg,
    onDeleteMainImg,
    existingAvailabilityImg,
    onDeleteAvailabilityImg,
}: {
    form: any;
    existingMainImg?: string;
    onDeleteMainImg?: () => void;
    existingAvailabilityImg?: string;
    onDeleteAvailabilityImg?: () => void;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Recursos visuales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <SingleImageField
                    form={form}
                    name="mainImg"
                    label="Imagen principal"
                    description="Máx 90MB. Formatos: JPEG, PNG, WebP."
                    existingSrc={existingMainImg}
                    onDeleteExisting={onDeleteMainImg}
                />
                <SingleImageField
                    form={form}
                    name="availabilityImg"
                    label="Plano de disponibilidad"
                    description="Imagen que muestra la distribución de lotes disponibles."
                    existingSrc={existingAvailabilityImg}
                    onDeleteExisting={onDeleteAvailabilityImg}
                />
                <GalleryField form={form} />
            </CardContent>
        </Card>
    );
}
