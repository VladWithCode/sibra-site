import type { TPagination } from "@/queries/type";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function buildPageItems(current: number, totalPages: number): (number | "ellipsis-left" | "ellipsis-right")[] {
    const pages = new Set<number>([1, totalPages, current - 1, current, current + 1]);
    const sorted = [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
    const items: (number | "ellipsis-left" | "ellipsis-right")[] = [];
    for (let i = 0; i < sorted.length; i++) {
        const n = sorted[i];
        items.push(n);
        const next = sorted[i + 1];
        if (next !== undefined && next - n > 1) {
            items.push(n < current ? "ellipsis-left" : "ellipsis-right");
        }
    }
    return items;
}

export function Pagination({ pagination }: { pagination: TPagination }) {
    const navigate = useNavigate();
    const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.perPage));
    if (totalPages <= 1) return null;

    const current = pagination.page;
    const items = buildPageItems(current, totalPages);

    const goTo = (n: number) => {
        navigate({
            search: (prev) => ({ ...prev, page: n === 1 ? undefined : n }),
            replace: true,
        });
    };

    const baseBtn = "h-10 min-w-10 px-3 inline-flex items-center justify-center rounded-xl border border-outline-variant bg-white text-sm font-semibold text-on-surface transition-all hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white";
    const activeBtn = "h-10 min-w-10 px-3 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sbr-blue to-primary-container text-primary-foreground text-sm font-bold shadow-md shadow-primary/20 cursor-default";

    return (
        <nav
            aria-label="Paginación de propiedades"
            className="max-w-full xl:max-w-7xl mx-auto mt-10 flex items-center justify-center gap-2 px-3"
        >
            <button
                type="button"
                aria-label="Página anterior"
                disabled={!pagination.hasPrev}
                onClick={() => goTo(current - 1)}
                className={baseBtn}
            >
                <ChevronLeft className="size-4" />
            </button>
            {items.map((item, idx) => {
                if (item === "ellipsis-left" || item === "ellipsis-right") {
                    return (
                        <span
                            key={`${item}-${idx}`}
                            aria-hidden
                            className="size-8 inline-flex items-center justify-center text-on-surface-variant text-sm"
                        >
                            …
                        </span>
                    );
                }
                const isCurrent = item === current;
                return (
                    <button
                        key={item}
                        type="button"
                        aria-label={`Ir a la página ${item}`}
                        aria-current={isCurrent ? "page" : undefined}
                        disabled={isCurrent}
                        onClick={() => goTo(item)}
                        className={isCurrent ? activeBtn : baseBtn}
                    >
                        {item}
                    </button>
                );
            })}
            <button
                type="button"
                aria-label="Página siguiente"
                disabled={!pagination.hasNext}
                onClick={() => goTo(current + 1)}
                className={baseBtn}
            >
                <ChevronRight className="size-4" />
            </button>
        </nav>
    );
}
