import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ICON_NAMES, LucideIcon } from "./property/LucideIcon";

const MAX_RESULTS = 90;

/** Searchable Lucide icon selector. Renders the control only — wrap it in your
 * own Field/FieldLabel/FieldError. `value`/`onChange` hold the icon name. */
export function LucideIconPicker({
    value,
    onChange,
    id,
    placeholder = "Buscar ícono...",
}: {
    value: string;
    onChange: (name: string) => void;
    id?: string;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const hasIcon = !!(value ?? "").trim();

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const base = q ? ICON_NAMES.filter((n) => n.toLowerCase().includes(q)) : ICON_NAMES;
        return base.slice(0, MAX_RESULTS);
    }, [query]);

    return (
        <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        className="flex-1 justify-between font-normal"
                    >
                        <span className="flex items-center gap-2 truncate">
                            {hasIcon ? (
                                <LucideIcon
                                    name={value}
                                    className="text-primary size-4 shrink-0"
                                />
                            ) : (
                                <span className="bg-muted/40 flex size-4 shrink-0 items-center justify-center rounded text-[10px]">
                                    ?
                                </span>
                            )}
                            <span className="truncate">{value || "Seleccionar ícono"}</span>
                        </span>
                        <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="start">
                    <div className="relative mb-2">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                        <Input
                            autoFocus
                            className="pl-8"
                            placeholder={placeholder}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <div className="grid max-h-60 grid-cols-6 gap-1 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="text-muted-foreground col-span-6 py-6 text-center text-sm">
                                Sin resultados
                            </p>
                        ) : (
                            filtered.map((name) => {
                                const active = name === value;
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        title={name}
                                        onClick={() => {
                                            onChange(name);
                                            setOpen(false);
                                            setQuery("");
                                        }}
                                        className={`hover:bg-accent flex aspect-square items-center justify-center rounded-md border transition-colors ${
                                            active ? "border-primary bg-primary/10" : "border-transparent"
                                        }`}
                                    >
                                        <LucideIcon name={name} className="size-4" />
                                    </button>
                                );
                            })
                        )}
                    </div>
                    <p className="text-muted-foreground mt-2 text-center text-xs">
                        Ver todos en{" "}
                        <a
                            href="https://lucide.dev/icons"
                            target="_blank"
                            rel="noreferrer"
                            className="underline"
                        >
                            lucide.dev
                        </a>
                    </p>
                </PopoverContent>
            </Popover>
            {value ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange("")}
                    aria-label="Quitar ícono"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                >
                    <X className="size-4" />
                </Button>
            ) : null}
        </div>
    );
}
