import { LucideIconPicker } from "@/components/dashboard/LucideIconPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CloudUpload, Plus, Trash2, Trees } from "lucide-react";
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

function AmenityRow({ form, index }: { form: any; index: number }) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <form.Field name={`amenities[${index}]`}>
            {(_groupField: any) => (
                <div className="border-outline-variant/40 space-y-4 rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">Amenidad #{index + 1}</p>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => form.removeFieldValue("amenities", index)}
                            aria-label="Eliminar amenidad"
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <form.Field name={`amenities[${index}].name`}>
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor={`amenity-${index}-name`}>Nombre</FieldLabel>
                                    <Input
                                        id={`amenity-${index}-name`}
                                        value={field.state.value ?? ""}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="Ej. Casa club"
                                    />
                                    <FieldError errors={errsOf(field)} />
                                </Field>
                            )}
                        </form.Field>

                        <form.Field name={`amenities[${index}].icon`}>
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor={`amenity-${index}-icon`}>
                                        Ícono (Lucide)
                                    </FieldLabel>
                                    <LucideIconPicker
                                        id={`amenity-${index}-icon`}
                                        value={field.state.value ?? ""}
                                        onChange={(v) => field.handleChange(v)}
                                    />
                                    <FieldError errors={errsOf(field)} />
                                </Field>
                            )}
                        </form.Field>
                    </div>

                    <form.Field name={`amenities[${index}].file`}>
                        {(field: any) => {
                            const file = field.state.value as File | undefined;
                            return (
                                <Field>
                                    <FieldLabel>Imagen (opcional)</FieldLabel>
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
                                        <AmenityImagePreview
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
                                            className="border-outline-variant/40 hover:border-primary/60 hover:bg-accent/40 flex h-32 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-4 text-center transition-colors"
                                        >
                                            <CloudUpload className="text-primary size-6" />
                                            <p className="text-xs font-medium">Subir imagen</p>
                                        </button>
                                    )}
                                    <FieldError errors={errsOf(field)} />
                                </Field>
                            );
                        }}
                    </form.Field>
                </div>
            )}
        </form.Field>
    );
}

function AmenityImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
    const url = useObjectUrl(file);
    return (
        <div className="group relative h-32 w-full overflow-hidden rounded-lg">
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

export function AmenitiesSection({ form }: { form: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Trees className="size-5" />
                    Amenidades
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form.Field name="amenities" mode="array">
                    {(field: any) => {
                        const items = (field.state.value ?? []) as Array<unknown>;
                        return (
                            <div className="space-y-4">
                                {items.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        Aún no hay amenidades. Agrega la primera.
                                    </p>
                                ) : (
                                    items.map((_, i) => (
                                        <AmenityRow key={i} form={form} index={i} />
                                    ))
                                )}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        field.pushValue({ name: "", icon: "", file: undefined })
                                    }
                                >
                                    <Plus className="size-4" />
                                    Agregar amenidad
                                </Button>
                            </div>
                        );
                    }}
                </form.Field>
            </CardContent>
        </Card>
    );
}
