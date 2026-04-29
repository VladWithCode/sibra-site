import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { Phone, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { REQUEST_STATUS_OPTIONS } from "./RequestStatusBadge";

const ANY = "any" as const;

export type PanelRequestsFilterValues = {
    name?: string;
    phone?: string;
    type?: string;
    status?: string;
    scheduledDate?: string;
    createdAt?: string;
};

const REQUEST_TYPE_OPTIONS = [
    { value: "informacion", label: "Información" },
    { value: "cita", label: "Cita" },
    { value: "venta", label: "Venta" },
    { value: "precalificacion", label: "Precalificación" },
    { value: "proyecto", label: "Proyecto" },
] as const;

export function RequestsFilters({ filters }: { filters: PanelRequestsFilterValues }) {
    const navigate = useNavigate();
    const [nameSearch, setNameSearch] = useState(filters.name ?? "");
    const [phoneSearch, setPhoneSearch] = useState(filters.phone ?? "");
    const nameDebounceRef = useRef<ReturnType<typeof setTimeout>>(null);
    const phoneDebounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        setNameSearch(filters.name ?? "");
    }, [filters.name]);

    useEffect(() => {
        setPhoneSearch(filters.phone ?? "");
    }, [filters.phone]);

    useEffect(
        () => () => {
            if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
            if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
        },
        [],
    );

    const updateSearch = useCallback(
        (key: keyof PanelRequestsFilterValues, value: string | undefined) => {
            navigate({
                to: ".",
                // @ts-ignore — tanstack router infers root search shape, we know the route
                search: (prev) => ({ ...prev, [key]: value || undefined, page: undefined }),
                replace: true,
            });
        },
        [navigate],
    );

    const onNameChange = (value: string) => {
        setNameSearch(value);
        if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
        nameDebounceRef.current = setTimeout(() => updateSearch("name", value), 400);
    };

    const onPhoneChange = (value: string) => {
        setPhoneSearch(value);
        if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
        phoneDebounceRef.current = setTimeout(() => updateSearch("phone", value), 400);
    };

    const onSelect = (key: keyof PanelRequestsFilterValues) => (value: string) => {
        updateSearch(key, value === ANY ? undefined : value);
    };

    const hasActiveFilters = Boolean(
        filters.name || filters.phone || filters.type || filters.status || filters.scheduledDate || filters.createdAt,
    );

    const clearAll = () => {
        setNameSearch("");
        setPhoneSearch("");
        if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
        if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
        navigate({
            to: ".",
            // @ts-ignore
            search: () => ({}),
            replace: true,
        });
    };

    const selectTriggerClass =
        "w-full lg:w-44 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-sm";

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
                <div className="relative lg:flex-1">
                    <Search
                        aria-hidden
                        className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline"
                    />
                    <Input
                        type="search"
                        name="nameSearch"
                        placeholder="Buscar por nombre…"
                        value={nameSearch}
                        onChange={(e) => onNameChange(e.target.value)}
                        className="pl-9 pr-3 bg-surface-container-lowest border-outline-variant/40 rounded-lg"
                    />
                </div>
                <div className="relative lg:flex-1">
                    <Phone
                        aria-hidden
                        className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline"
                    />
                    <Input
                        type="search"
                        name="phoneSearch"
                        placeholder="Buscar por teléfono…"
                        value={phoneSearch}
                        onChange={(e) => onPhoneChange(e.target.value)}
                        className="pl-9 pr-3 bg-surface-container-lowest border-outline-variant/40 rounded-lg"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:flex lg:items-end lg:gap-3">
                <Select
                    value={filters.type ?? ANY}
                    onValueChange={onSelect("type")}
                >
                    <SelectTrigger className={selectTriggerClass} aria-label="Filtrar por tipo">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ANY}>Todos los tipos</SelectItem>
                        {REQUEST_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.status ?? ANY}
                    onValueChange={onSelect("status")}
                >
                    <SelectTrigger className={selectTriggerClass} aria-label="Filtrar por estado">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ANY}>Todos los estados</SelectItem>
                        {REQUEST_STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex flex-col gap-1">
                    <label className="text-tiny uppercase tracking-wider text-outline font-bold">
                        Fecha de cita
                    </label>
                    <Input
                        type="date"
                        value={filters.scheduledDate ?? ""}
                        onChange={(e) => updateSearch("scheduledDate", e.target.value || undefined)}
                        className="bg-surface-container-lowest border-outline-variant/40 rounded-lg text-sm"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-tiny uppercase tracking-wider text-outline font-bold">
                        Fecha de creación
                    </label>
                    <Input
                        type="date"
                        value={filters.createdAt ?? ""}
                        onChange={(e) => updateSearch("createdAt", e.target.value || undefined)}
                        className="bg-surface-container-lowest border-outline-variant/40 rounded-lg text-sm"
                    />
                </div>

                {hasActiveFilters ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearAll}
                        className="col-span-2 lg:col-span-1 gap-1 text-on-surface-variant"
                    >
                        <X className="size-4" />
                        Limpiar
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
