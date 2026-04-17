import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PROPERTY_STATUS_OPTIONS } from "./PropertyStatusBadge";

const ANY = "any" as const;

export type PanelPropertiesFilterValues = {
    q?: string;
    status?: string;
    propType?: string;
    contract?: string;
};

const PROPERTY_TYPE_OPTIONS = [
    { value: "casa", label: "Casa" },
    { value: "apartamento", label: "Apartamento" },
    { value: "terreno", label: "Terreno" },
] as const;

const CONTRACT_OPTIONS = [
    { value: "venta", label: "Venta" },
    { value: "renta", label: "Renta" },
] as const;

export function PropertiesFilters({ filters }: { filters: PanelPropertiesFilterValues }) {
    const navigate = useNavigate();
    const [search, setSearch] = useState(filters.q ?? "");
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        setSearch(filters.q ?? "");
    }, [filters.q]);

    useEffect(
        () => () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        },
        [],
    );

    const updateSearch = useCallback(
        (key: keyof PanelPropertiesFilterValues, value: string | undefined) => {
            navigate({
                to: ".",
                // @ts-ignore — tanstack router infers root search shape, we know the route
                search: (prev) => ({ ...prev, [key]: value || undefined, page: undefined }),
                replace: true,
            });
        },
        [navigate],
    );

    const onSearchChange = (value: string) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => updateSearch("q", value), 400);
    };

    const onSelect = (key: keyof PanelPropertiesFilterValues) => (value: string) => {
        updateSearch(key, value === ANY ? undefined : value);
    };

    const hasActiveFilters = Boolean(filters.q || filters.status || filters.propType || filters.contract);

    const clearAll = () => {
        setSearch("");
        if (debounceRef.current) clearTimeout(debounceRef.current);
        navigate({
            to: ".",
            // @ts-ignore
            search: () => ({}),
            replace: true,
        });
    };

    const selectTriggerClass =
        "w-full lg:w-44 h-10 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-sm";

    return (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
            <div className="relative lg:flex-1">
                <Search
                    aria-hidden
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline"
                />
                <Input
                    type="search"
                    name="search"
                    placeholder="Buscar por dirección, colonia, ciudad…"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-10 pl-9 pr-3 bg-surface-container-lowest border-outline-variant/40 rounded-lg"
                />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:flex lg:items-center lg:gap-3">
                <Select
                    value={filters.status ?? ANY}
                    onValueChange={onSelect("status")}
                >
                    <SelectTrigger className={selectTriggerClass} aria-label="Filtrar por estado">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ANY}>Todos los estados</SelectItem>
                        {PROPERTY_STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.propType ?? ANY}
                    onValueChange={onSelect("propType")}
                >
                    <SelectTrigger className={selectTriggerClass} aria-label="Filtrar por tipo">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ANY}>Todos los tipos</SelectItem>
                        {PROPERTY_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.contract ?? ANY}
                    onValueChange={onSelect("contract")}
                >
                    <SelectTrigger className={selectTriggerClass} aria-label="Filtrar por contrato">
                        <SelectValue placeholder="Contrato" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ANY}>Todos los contratos</SelectItem>
                        {CONTRACT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {hasActiveFilters ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearAll}
                        className="col-span-2 lg:col-span-1 h-10 gap-1 text-on-surface-variant"
                    >
                        <X className="size-4" />
                        Limpiar
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
