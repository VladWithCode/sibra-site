import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { FormCard, FormStep } from "./schema";

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
                                <Input
                                    value={c.image}
                                    placeholder="Imagen (ruta, ej. /imagen.webp)"
                                    onChange={(e) => setAt(i, { image: e.target.value })}
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
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        value={s.step}
                                        placeholder="Número (1)"
                                        onChange={(e) => setAt(i, { step: e.target.value })}
                                    />
                                    <Input
                                        value={s.icon}
                                        placeholder="Icono (opcional)"
                                        onChange={(e) => setAt(i, { icon: e.target.value })}
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
