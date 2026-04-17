import type { TPagination } from "@/queries/type";
import { useNavigate } from "@tanstack/react-router";

export function PropertiesPaginator({ pagination }: { pagination: TPagination }) {
    const navigate = useNavigate();
    const { total, page, perPage, hasNext, hasPrev } = pagination;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const showingFrom = total === 0 ? 0 : (page - 1) * perPage + 1;
    const showingTo = Math.min(page * perPage, total);

    const goTo = (n: number) => {
        navigate({
            to: ".",
            // @ts-ignore — parent route's search schema allows page
            search: (prev) => ({ ...prev, page: n <= 1 ? undefined : n }),
            replace: true,
        });
    };

    const baseBtn =
        "px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-xs font-semibold text-on-surface hover:bg-surface-bright transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-container-lowest";

    return (
        <div className="px-4 lg:px-6 py-4 bg-surface-container-low border-t border-surface-container-high flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <p className="text-xs text-outline">
                Mostrando{" "}
                <span className="font-bold text-on-surface">
                    {showingFrom}–{showingTo}
                </span>{" "}
                de <span className="font-bold text-on-surface">{total}</span>{" "}
                {total === 1 ? "propiedad" : "propiedades"}
            </p>
            {totalPages > 1 ? (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className={baseBtn}
                        disabled={!hasPrev}
                        onClick={() => goTo(page - 1)}
                    >
                        Anterior
                    </button>
                    <span className="text-xs text-on-surface-variant px-1">
                        Página {page} de {totalPages}
                    </span>
                    <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg bg-sbr-blue text-white text-xs font-semibold hover:bg-sbr-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-sbr-blue"
                        disabled={!hasNext}
                        onClick={() => goTo(page + 1)}
                    >
                        Siguiente
                    </button>
                </div>
            ) : null}
        </div>
    );
}
