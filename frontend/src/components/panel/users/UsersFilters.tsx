import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ROLE_OPTIONS } from "./UserRoleBadge";

const ANY = "any" as const;

export type PanelUsersFilterValues = {
    search?: string;
    role?: string;
};

export function UsersFilters({ filters }: { filters: PanelUsersFilterValues }) {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState(filters.search ?? "");
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        setSearchText(filters.search ?? "");
    }, [filters.search]);

    useEffect(
        () => () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        },
        [],
    );

    const updateSearch = useCallback(
        (key: keyof PanelUsersFilterValues, value: string | undefined) => {
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
        setSearchText(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => updateSearch("search", value), 400);
    };

    const onSelect = (key: keyof PanelUsersFilterValues) => (value: string) => {
        updateSearch(key, value === ANY ? undefined : value);
    };

    const hasActiveFilters = Boolean(filters.search || filters.role);

    const clearAll = () => {
        setSearchText("");
        if (debounceRef.current) clearTimeout(debounceRef.current);
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
            <div className="relative lg:flex-1">
                <Search
                    aria-hidden
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline"
                />
                <Input
                    type="search"
                    name="userSearch"
                    placeholder="Buscar por nombre, usuario o email…"
                    value={searchText}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 pr-3 bg-surface-container-lowest border-outline-variant/40 rounded-lg"
                />
            </div>

            <Select
                value={filters.role ?? ANY}
                onValueChange={onSelect("role")}
            >
                <SelectTrigger className={selectTriggerClass} aria-label="Filtrar por rol">
                    <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ANY}>Todos los roles</SelectItem>
                    {ROLE_OPTIONS.map((opt) => (
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
                    className="gap-1 text-on-surface-variant"
                >
                    <X className="size-4" />
                    Limpiar
                </Button>
            ) : null}
        </div>
    );
}
