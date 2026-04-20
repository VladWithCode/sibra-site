import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function ProjectsSearch({ q }: { q?: string }) {
    const navigate = useNavigate();
    const [search, setSearch] = useState(q ?? "");
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        setSearch(q ?? "");
    }, [q]);

    useEffect(
        () => () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        },
        [],
    );

    const updateSearch = useCallback(
        (value: string | undefined) => {
            navigate({
                to: ".",
                // @ts-ignore — tanstack router infers root search shape, we know the route
                search: (prev) => ({ ...prev, q: value || undefined }),
                replace: true,
            });
        },
        [navigate],
    );

    const onSearchChange = (value: string) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => updateSearch(value), 400);
    };

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

    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-1">
                <Search
                    aria-hidden
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline"
                />
                <Input
                    type="search"
                    name="search"
                    placeholder="Buscar por nombre o ubicacion..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-10 pl-9 pr-3 bg-surface-container-lowest border-outline-variant/40 rounded-lg"
                />
            </div>
            {q ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-10 gap-1 text-on-surface-variant"
                >
                    <X className="size-4" />
                    Limpiar
                </Button>
            ) : null}
        </div>
    );
}
