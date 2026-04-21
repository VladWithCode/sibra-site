import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from '@tanstack/react-router';
import { Search, X } from 'lucide-react';
import { useRef } from 'react';

export function AssociatesSearch({ q }: { q?: string }) {
    const navigate = useNavigate();
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    const onSearch = (value: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            navigate({
                to: '.',
                search: (prev) => ({
                    ...prev,
                    q: value || undefined,
                }),
            });
        }, 400);
    };

    const onClear = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        navigate({
            to: '.',
            search: (prev) => ({ ...prev, q: undefined }),
        });
    };

    return (
        <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline" />
                <Input
                    type="text"
                    placeholder="Buscar por nombre, RFC, CURP o telefono..."
                    defaultValue={q}
                    onChange={(e) => onSearch(e.target.value)}
                    className="pl-9 h-10"
                />
            </div>
            {q && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="gap-1 text-xs"
                >
                    <X className="size-3" />
                    Limpiar
                </Button>
            )}
        </div>
    );
}
