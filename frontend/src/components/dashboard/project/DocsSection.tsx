import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CloudUpload, FileText, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";

type ErrorList = Array<{ message?: string } | undefined>;

function errsOf(field: { state: { meta: { errors: unknown } } }) {
    return field.state.meta.errors as unknown as ErrorList;
}

function DocRow({ form, index }: { form: any; index: number }) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <form.Field name={`docs[${index}]`}>
            {(_groupField: any) => (
                <div className="border-outline-variant/40 space-y-4 rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">Documento #{index + 1}</p>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => form.removeFieldValue("docs", index)}
                            aria-label="Eliminar documento"
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>

                    <form.Field name={`docs[${index}].name`}>
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor={`doc-${index}-name`}>Nombre</FieldLabel>
                                <Input
                                    id={`doc-${index}-name`}
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Ej. Reglamento interno"
                                />
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>

                    <form.Field name={`docs[${index}].description`}>
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor={`doc-${index}-description`}>
                                    Descripción
                                </FieldLabel>
                                <Textarea
                                    id={`doc-${index}-description`}
                                    rows={2}
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Descripción breve del documento..."
                                />
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>

                    <form.Field name={`docs[${index}].file`}>
                        {(field: any) => {
                            const file = field.state.value as File | undefined;
                            return (
                                <Field>
                                    <FieldLabel>Archivo</FieldLabel>
                                    <FieldDescription>
                                        El archivo será accesible por los asociados del proyecto.
                                    </FieldDescription>
                                    <input
                                        ref={inputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            field.handleChange(f);
                                        }}
                                    />
                                    {file ? (
                                        <div className="border-outline-variant/40 flex items-center gap-3 rounded-md border p-3">
                                            <FileText className="text-primary size-5 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {file.name}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    field.handleChange(undefined);
                                                    if (inputRef.current) inputRef.current.value = "";
                                                }}
                                                aria-label="Quitar archivo"
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => inputRef.current?.click()}
                                            className="border-outline-variant/40 hover:border-primary/60 hover:bg-accent/40 flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-3 text-center transition-colors"
                                        >
                                            <CloudUpload className="text-primary size-6" />
                                            <p className="text-xs font-medium">Subir archivo</p>
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

export function DocsSection({ form }: { form: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="size-5" />
                    Documentos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form.Field name="docs" mode="array">
                    {(field: any) => {
                        const items = (field.state.value ?? []) as Array<unknown>;
                        return (
                            <div className="space-y-4">
                                {items.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        Aún no hay documentos. Agrega el primero.
                                    </p>
                                ) : (
                                    items.map((_, i) => (
                                        <DocRow key={i} form={form} index={i} />
                                    ))
                                )}

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        field.pushValue({
                                            name: "",
                                            description: "",
                                            file: undefined,
                                        })
                                    }
                                >
                                    <Plus className="size-4" />
                                    Agregar documento
                                </Button>
                            </div>
                        );
                    }}
                </form.Field>
            </CardContent>
        </Card>
    );
}
