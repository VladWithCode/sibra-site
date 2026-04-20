import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAppealItemsOpts } from "@/queries/projects";
import type { TProjectAppealItem } from "@/queries/type";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Sparkles, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { CreateAppealItemDialog } from "./CreateAppealItemDialog";

type AppealItemInput = {
    id?: string;
    name: string;
    description: string;
};

function itemKey(i: AppealItemInput): string {
    return i.id ?? i.name.trim().toLowerCase();
}

function isSelected(selected: AppealItemInput[], item: AppealItemInput): boolean {
    const key = itemKey(item);
    return selected.some((s) => itemKey(s) === key);
}

export function AppealSection({ form }: { form: any }) {
    const { data } = useQuery(getAppealItemsOpts);
    const items = data?.items ?? [];
    const triggerRef = useRef<HTMLButtonElement>(null);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="size-5" />
                    Atractivos
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form.Field name="appeal_list">
                    {(field: any) => {
                        const selected = (field.state.value ?? []) as AppealItemInput[];
                        return (
                            <>
                                <AppealItemPicker
                                    items={items}
                                    selected={selected}
                                    onChange={(next) => field.handleChange(next)}
                                    onCreateClick={() => triggerRef.current?.click()}
                                />
                                <CreateAppealItemDialog
                                    onCreated={(a: TProjectAppealItem) => {
                                        field.handleChange([...selected, a]);
                                    }}
                                >
                                    <button
                                        type="button"
                                        ref={triggerRef}
                                        className="hidden"
                                    />
                                </CreateAppealItemDialog>
                            </>
                        );
                    }}
                </form.Field>
            </CardContent>
        </Card>
    );
}

function AppealItemPicker({
    items,
    selected,
    onChange,
    onCreateClick,
}: {
    items: AppealItemInput[];
    selected: AppealItemInput[];
    onChange: (next: AppealItemInput[]) => void;
    onCreateClick: () => void;
}) {
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter(
            (i) =>
                i.name.toLowerCase().includes(q) ||
                (i.description ?? "").toLowerCase().includes(q),
        );
    }, [items, query]);

    const toggle = (item: AppealItemInput) => {
        if (isSelected(selected, item)) {
            onChange(selected.filter((s) => itemKey(s) !== itemKey(item)));
        } else {
            onChange([...selected, item]);
        }
    };

    return (
        <div className="space-y-4">
            {selected.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                    {selected.map((s) => (
                        <li
                            key={itemKey(s)}
                            className="bg-primary/5 border-primary/20 flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
                        >
                            <Sparkles className="text-primary size-4" />
                            <span>{s.name}</span>
                            <button
                                type="button"
                                onClick={() => toggle(s)}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label={`Quitar ${s.name}`}
                            >
                                <X className="size-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-muted-foreground text-sm">
                    Aún no has seleccionado ningún atractivo.
                </p>
            )}

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        className="pl-9"
                        placeholder="Buscar..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <Button type="button" variant="outline" onClick={onCreateClick}>
                    <Plus className="size-4" />
                    Nuevo atractivo
                </Button>
            </div>

            <div className="max-h-64 overflow-y-auto rounded-md border">
                {filtered.length === 0 ? (
                    <p className="text-muted-foreground p-4 text-center text-sm">
                        No hay coincidencias.
                    </p>
                ) : (
                    <ul className="divide-y">
                        {filtered.map((i) => {
                            const on = isSelected(selected, i);
                            return (
                                <li key={itemKey(i)}>
                                    <button
                                        type="button"
                                        onClick={() => toggle(i)}
                                        className={`hover:bg-accent/40 flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                                            on ? "bg-primary/5" : ""
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{i.name}</p>
                                            {i.description ? (
                                                <p className="text-muted-foreground text-xs">
                                                    {i.description}
                                                </p>
                                            ) : null}
                                        </div>
                                        <span
                                            className={`text-xs font-semibold ${
                                                on ? "text-primary" : "text-muted-foreground"
                                            }`}
                                        >
                                            {on ? "Seleccionado" : "Añadir"}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
