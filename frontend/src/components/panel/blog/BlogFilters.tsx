import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BLOG_STATUS_OPTIONS } from "./BlogStatusBadge";

const ANY = "any" as const;

export type BlogFilterValues = {
    q?: string;
    status?: string;
};

export function BlogFilters({ filters }: { filters: BlogFilterValues }) {
    const navigate = useNavigate();
    const [search, setSearch] = useState(filters.q ?? "");
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => { setSearch(filters.q ?? ""); }, [filters.q]);
    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    const updateSearch = useCallback(
        (key: keyof BlogFilterValues, value: string | undefined) => {
            navigate({
                to: ".",
                // @ts-ignore
                search: (prev: any) => ({ ...prev, [key]: value || undefined, page: undefined }),
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

    const hasActive = Boolean(filters.q || filters.status);

    const clearAll = () => {
        setSearch("");
        if (debounceRef.current) clearTimeout(debounceRef.current);
        // @ts-ignore
        navigate({ to: ".", search: () => ({}), replace: true });
    };

    return (
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
            <div className="relative lg:flex-1">
                <Search aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline" />
                <Input
                    type="search"
                    placeholder="Buscar por título…"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-10 pl-9 bg-surface-container-lowest border-outline-variant/40 rounded-lg"
                />
            </div>
            <div className="flex gap-3">
                <Select
                    value={filters.status ?? ANY}
                    onValueChange={(v) => updateSearch("status", v === ANY ? undefined : v)}
                >
                    <SelectTrigger className="w-44 h-10 bg-surface-container-lowest border-outline-variant/40 rounded-lg text-sm">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ANY}>Todos los estados</SelectItem>
                        {BLOG_STATUS_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {hasActive && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="h-10 gap-1 text-on-surface-variant">
                        <X className="size-4" />
                        Limpiar
                    </Button>
                )}
            </div>
        </div>
    );
}
