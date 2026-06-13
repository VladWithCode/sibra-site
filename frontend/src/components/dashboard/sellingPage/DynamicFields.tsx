import { LucideIconPicker } from "@/components/dashboard/LucideIconPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { uploadSellingPageImageOpts } from "@/queries/sellingPages";
import { useMutation } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { FormCard, FormStep } from "./schema";

/** Resolve a stored card image (bare upload filename or explicit path/URL) to a
 * displayable src. Uploaded files are bare names served from /static/uploads. */
function imageSrc(value: string): string {
    if (!value) return "";
    if (value.startsWith("/") || value.startsWith("http")) return value;
    return `/static/uploads/${value}`;
}

/** Image field with its own "Subir" button. Uploading is decoupled from the
 * main create/edit form: it hits the page-independent upload endpoint and sets
 * the card's image to the returned filename. */
function CardImageField({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const uploadMut = useMutation(uploadSellingPageImageOpts());

    const previewUrl = imageSrc(value);

    async function onUpload() {
        if (!file) return;
        try {
            const res = await uploadMut.mutateAsync(file);
            onChange(res.filename);
            toast.success("Imagen subida", { closeButton: true });
            setFile(null);
            if (inputRef.current) inputRef.current.value = "";
        } catch (e: any) {
            toast.error(e?.message || "Error al subir la imagen", { closeButton: true });
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt=""
                        className="h-12 w-16 rounded border object-cover"
                    />
                ) : null}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="flex-1 text-sm"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Button
                    type="button"
                    size="sm"
                    disabled={!file || uploadMut.isPending}
                    onClick={onUpload}
                >
                    {uploadMut.isPending ? "Subiendo..." : "Subir"}
                </Button>
            </div>
            <Input
                value={value}
                placeholder="Imagen (ruta, ej. /imagen.webp, o súbela arriba)"
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

/** Editable list of plain strings (features, chips). */
export function DynamicStringList({
    form,
    name,
    itemLabel,
    addLabel,
    placeholder,
}: {
    form: any;
    name: string;
    itemLabel: string;
    addLabel: string;
    placeholder?: string;
}) {
    return (
        <form.Field name={name}>
            {(field: any) => {
                const items: string[] = field.state.value ?? [];
                const setAt = (i: number, v: string) => {
                    const next = [...items];
                    next[i] = v;
                    field.handleChange(next);
                };
                const remove = (i: number) =>
                    field.handleChange(items.filter((_, idx) => idx !== i));
                const add = () => field.handleChange([...items, ""]);

                return (
                    <div className="space-y-2">
                        {items.length === 0 && (
                            <p className="text-muted-foreground text-sm">
                                Sin {itemLabel.toLowerCase()}s. Agrega el primero.
                            </p>
                        )}
                        {items.map((val, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Input
                                    value={val ?? ""}
                                    placeholder={placeholder ?? itemLabel}
                                    onChange={(e) => setAt(i, e.target.value)}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => remove(i)}
                                    aria-label="Eliminar"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="secondary" size="sm" onClick={add}>
                            <Plus className="size-4" /> {addLabel}
                        </Button>
                    </div>
                );
            }}
        </form.Field>
    );
}

/** Editable list of cards (título, descripción, imagen). */
export function DynamicCardsField({ form, name }: { form: any; name: string }) {
    const empty: FormCard = { title: "", description: "", image: "" };
    return (
        <form.Field name={name}>
            {(field: any) => {
                const items: FormCard[] = field.state.value ?? [];
                const setAt = (i: number, patch: Partial<FormCard>) => {
                    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
                    field.handleChange(next);
                };
                const remove = (i: number) =>
                    field.handleChange(items.filter((_, idx) => idx !== i));
                const add = () => field.handleChange([...items, { ...empty }]);

                return (
                    <div className="space-y-3">
                        {items.length === 0 && (
                            <p className="text-muted-foreground text-sm">
                                Sin tarjetas. Agrega la primera.
                            </p>
                        )}
                        {items.map((c, i) => (
                            <div key={i} className="space-y-2 rounded-lg border p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Tarjeta {i + 1}</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => remove(i)}
                                        aria-label="Eliminar"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                                <Input
                                    value={c.title}
                                    placeholder="Título"
                                    onChange={(e) => setAt(i, { title: e.target.value })}
                                />
                                <Textarea
                                    rows={2}
                                    value={c.description}
                                    placeholder="Descripción"
                                    onChange={(e) => setAt(i, { description: e.target.value })}
                                />
                                <CardImageField
                                    value={c.image}
                                    onChange={(v) => setAt(i, { image: v })}
                                />
                            </div>
                        ))}
                        <Button type="button" variant="secondary" size="sm" onClick={add}>
                            <Plus className="size-4" /> Agregar tarjeta
                        </Button>
                    </div>
                );
            }}
        </form.Field>
    );
}

/** Editable list of steps (número, título, descripción multilínea, icono). */
export function DynamicStepsField({ form, name }: { form: any; name: string }) {
    const empty: FormStep = { step: "", title: "", descriptionText: "", icon: "" };
    return (
        <form.Field name={name}>
            {(field: any) => {
                const items: FormStep[] = field.state.value ?? [];
                const setAt = (i: number, patch: Partial<FormStep>) => {
                    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
                    field.handleChange(next);
                };
                const remove = (i: number) =>
                    field.handleChange(items.filter((_, idx) => idx !== i));
                const add = () => field.handleChange([...items, { ...empty }]);

                return (
                    <div className="space-y-3">
                        {items.length === 0 && (
                            <p className="text-muted-foreground text-sm">
                                Sin pasos. Agrega el primero.
                            </p>
                        )}
                        {items.map((s, i) => (
                            <div key={i} className="space-y-2 rounded-lg border p-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Paso {i + 1}</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => remove(i)}
                                        aria-label="Eliminar"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <Input
                                        value={s.step}
                                        placeholder="Número (1)"
                                        onChange={(e) => setAt(i, { step: e.target.value })}
                                    />
                                    <LucideIconPicker
                                        value={s.icon}
                                        onChange={(v) => setAt(i, { icon: v })}
                                    />
                                </div>
                                <Input
                                    value={s.title}
                                    placeholder="Título"
                                    onChange={(e) => setAt(i, { title: e.target.value })}
                                />
                                <Textarea
                                    rows={2}
                                    value={s.descriptionText}
                                    placeholder="Descripción (una línea por renglón)"
                                    onChange={(e) =>
                                        setAt(i, { descriptionText: e.target.value })
                                    }
                                />
                            </div>
                        ))}
                        <Button type="button" variant="secondary" size="sm" onClick={add}>
                            <Plus className="size-4" /> Agregar paso
                        </Button>
                    </div>
                );
            }}
        </form.Field>
    );
}
