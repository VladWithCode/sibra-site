import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { LucideIcon } from "./LucideIcon";

export type PickerItem = {
    id?: string;
    icon: string;
    title: string;
    description?: string;
};

function itemKey(i: PickerItem): string {
    return i.id ?? i.title.trim().toLowerCase();
}

function isSelected(selected: PickerItem[], item: PickerItem): boolean {
    const key = itemKey(item);
    return selected.some((s) => itemKey(s) === key);
}

export function FeatureAmenityPicker({
    items,
    selected,
    onChange,
    onCreateClick,
    labelSingular,
}: {
    items: PickerItem[];
    selected: PickerItem[];
    onChange: (next: PickerItem[]) => void;
    onCreateClick: () => void;
    labelSingular: string;
}) {
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter(
            (i) =>
                i.title.toLowerCase().includes(q) ||
                (i.description ?? "").toLowerCase().includes(q),
        );
    }, [items, query]);

    const toggle = (item: PickerItem) => {
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
                            <LucideIcon name={s.icon} className="text-primary size-4" />
                            <span>{s.title}</span>
                            <button
                                type="button"
                                onClick={() => toggle(s)}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label={`Quitar ${s.title}`}
                            >
                                <X className="size-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-muted-foreground text-sm">
                    Aún no has seleccionado ninguna.
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
                    Nueva {labelSingular}
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
                                        <LucideIcon
                                            name={i.icon}
                                            className={`size-4 ${on ? "text-primary" : "text-muted-foreground"}`}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{i.title}</p>
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
                                            {on ? "Seleccionada" : "Añadir"}
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
