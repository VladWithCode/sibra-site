import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { CloudUpload, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

type ErrorList = Array<{ message?: string } | undefined>;

function errsOf(field: { state: { meta: { errors: unknown } } }) {
    return field.state.meta.errors as unknown as ErrorList;
}

function useObjectUrl(file: File | undefined | null) {
    const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => {
        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [url]);
    return url;
}

function useObjectUrls(files: File[]) {
    const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
    useEffect(() => {
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }, [urls]);
    return urls;
}

function MainImageField({ form }: { form: any }) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <form.Field name="mainImg">
            {(field: any) => {
                const file = field.state.value as File | undefined;
                return (
                    <Field>
                        <FieldLabel>Imagen principal</FieldLabel>
                        <FieldDescription>
                            Máx 90MB. Formatos: JPEG, PNG, WebP.
                        </FieldDescription>
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
                        {file ? (
                            <MainImagePreview
                                file={file}
                                onRemove={() => {
                                    field.handleChange(undefined);
                                    if (inputRef.current) inputRef.current.value = "";
                                }}
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="border-outline-variant/40 hover:border-primary/60 hover:bg-accent/40 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors"
                            >
                                <CloudUpload className="text-primary size-8" />
                                <p className="text-sm font-semibold">
                                    Subir imagen principal
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    Haz click o arrastra un archivo
                                </p>
                            </button>
                        )}
                        <FieldError errors={errsOf(field)} />
                    </Field>
                );
            }}
        </form.Field>
    );
}

function MainImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
    const url = useObjectUrl(file);
    return (
        <div className="group relative aspect-video w-full overflow-hidden rounded-lg">
            {url && <img src={url} alt="Imagen principal" className="h-full w-full object-cover" />}
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
                            Puedes agregar varias imágenes para la galería.
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

export function GallerySection({ form }: { form: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Recursos visuales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <MainImageField form={form} />
                <GalleryField form={form} />
            </CardContent>
        </Card>
    );
}
