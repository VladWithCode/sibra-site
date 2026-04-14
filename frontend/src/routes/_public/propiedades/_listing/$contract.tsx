import { LoadingCircles } from "@/components/icons/loadingCircles";
import { NewPropertyCard } from "@/components/properties/PropertyCard";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getPropertyListingOpts } from "@/queries/properties";
import type { TPagination, TProperty, TPropertyFilters } from "@/queries/type";
import { useUIStore } from "@/stores/uiStore";
import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, List, MapIcon, Search, SlidersHorizontal } from "lucide-react";
import { useInView } from "motion/react";
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import z from "zod";

const searchSchema = z.object({
    q: z.string().optional().catch(""),
    minPrice: z.coerce.number().positive().optional().catch(undefined),
    maxPrice: z.coerce.number().positive().optional().catch(undefined),
    beds: z.coerce.number().int().nonnegative().optional().catch(undefined),
    baths: z.coerce.number().int().nonnegative().optional().catch(undefined),
    minSqMt: z.coerce.number().positive().optional().catch(undefined),
    maxSqMt: z.coerce.number().positive().optional().catch(undefined),
    minLotSize: z.coerce.number().positive().optional().catch(undefined),
    maxLotSize: z.coerce.number().positive().optional().catch(undefined),
    minYearBuilt: z.coerce.number().int().positive().optional().catch(undefined),
    propType: z.enum(["casa", "apartamento", "terreno"]).optional().catch(undefined),
    page: z.coerce.number().int().positive().optional().catch(undefined),
    perPage: z.coerce.number().int().positive().optional().catch(undefined),
});

type TListingSearch = z.infer<typeof searchSchema>;

function searchToFilters(search: TListingSearch): Partial<TPropertyFilters> {
    return {
        textSearch: search.q ?? "",
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        beds: search.beds,
        baths: search.baths,
        minSqMt: search.minSqMt,
        maxSqMt: search.maxSqMt,
        minLotSize: search.minLotSize,
        maxLotSize: search.maxLotSize,
        minYearBuilt: search.minYearBuilt,
        propType: search.propType,
        page: search.page,
        perPage: search.perPage,
    };
}

export const Route = createFileRoute("/_public/propiedades/_listing/$contract")({
    component: RouteComponent,
    validateSearch: (search) => searchSchema.parse(search),
    loader: async ({ context, params }) => {
        const { contract } = params;
        await context.queryClient.ensureQueryData(
            getPropertyListingOpts({
                // @ts-ignore
                contract,
            }),
        );
    },
});

function ResultCount() {
    const contract = Route.useParams().contract;
    const search = Route.useSearch();
    const { data } = useSuspenseQuery(getPropertyListingOpts({
        // @ts-ignore
        contract,
        ...searchToFilters(search),
    }));
    const propertyCount = data?.pagination?.total ?? 0;
    return (
        <span className="text-[10px] uppercase tracking-widest text-outline font-bold">{propertyCount} Propiedades</span>
    );
}

function ResultCountLoading() {
    return (
        <div>
            <span className="sr-only">Cargando...</span>
            <LoadingCircles className="text-primary-container" />
        </div>
    );
}

function FilterSection() {
    const { setHeaderQuickStick } = useUIStore();
    const { q } = Route.useSearch();
    const navigate = useNavigate();
    const sentinelRef = useRef<HTMLDivElement>(null);
    const isSentinelInView = useInView(sentinelRef, {
        margin: "0px 0px 0px 0px",
    });

    useLayoutEffect(() => {
        setHeaderQuickStick(true);
    }, []);

    const [search, setSearch] = useState(q ?? "");
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    const onInputChange = useCallback((value: string) => {
        setSearch(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            navigate({
                search: (prev) => ({ ...prev, q: value || undefined, page: undefined }),
                replace: true,
            });
        }, 400);
    }, [navigate]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return (
        <>
            <div ref={sentinelRef} className="relative h-0 overflow-hidden pointer-events-none" aria-hidden />
            <section
                className="sticky top-0 inset-x-0 z-30 translate-y-0 data-[stuck=true]:translate-y-(--header-height) bg-surface-container-high/0 data-[stuck=true]:bg-surface-container-high transition-[transform,translate,background] group data-[stuck=true]:shadow-md"
                data-stuck={!isSentinelInView}
            >
                <div className="max-w-7xl mx-auto bg-surface-container/0 group-data-[sticky=true]:bg-surface-container px-6 py-3 space-y-4">
                    <div className="grid grid-cols-[auto_1fr_auto] grid-rows-1 gap-3">
                        <Label htmlFor="main-property-search" className="relative z-10 inline-block col-start-1 row-start-1 my-auto px-3">
                            <Search className="size-4.5 stroke-3" style={{ color: "var(--color-outline-variant)" }} />
                        </Label>
                        <Input
                            className="col-start-1 row-start-1 col-span-2 w-full h-12 pl-10 pr-4 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium transition-all"
                            placeholder="Colonia, Codigo Postal, etc."
                            type="text"
                            id="main-property-search"
                            name="search"
                            value={search}
                            onChange={(e) => onInputChange(e.target.value)}
                        />
                        <FiltersDialog />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 p-1 bg-surface-container-high group-data-[stuck=true]:bg-surface-container-highest border border-surface-container-high group-data-[stuck=true]:border-outline-variant rounded-xl">
                            <button className="px-4 py-1.5 bg-white text-primary text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all">
                                <List />
                                List
                            </button>
                            <button className="px-4 py-1.5 text-on-surface-variant text-xs font-semibold rounded-lg hover:bg-white/50 transition-all flex items-center gap-2">
                                <MapIcon />
                                Map
                            </button>
                        </div>
                        <Suspense fallback={<ResultCountLoading />}>
                            <ResultCount />
                        </Suspense>
                    </div>
                </div>
            </section>
        </>
    );
}

function FiltersDialog() {
    const navigate = useNavigate();
    const search = Route.useSearch();
    const [open, setOpen] = useState(false);

    const form = useForm({
        defaultValues: {
            minPrice: search.minPrice?.toString() ?? "",
            maxPrice: search.maxPrice?.toString() ?? "",
            beds: search.beds?.toString() ?? "",
            baths: search.baths?.toString() ?? "",
            minSqMt: search.minSqMt?.toString() ?? "",
            maxSqMt: search.maxSqMt?.toString() ?? "",
            minLotSize: search.minLotSize?.toString() ?? "",
            maxLotSize: search.maxLotSize?.toString() ?? "",
            minYearBuilt: search.minYearBuilt?.toString() ?? "",
            propType: search.propType ?? "",
        },
        onSubmit: ({ value }) => {
            const toNumOrUndef = (s: string) => {
                const n = Number(s);
                return s !== "" && Number.isFinite(n) && n > 0 ? n : undefined;
            };
            const next: Partial<TListingSearch> = {
                minPrice: toNumOrUndef(value.minPrice),
                maxPrice: toNumOrUndef(value.maxPrice),
                beds: toNumOrUndef(value.beds),
                baths: toNumOrUndef(value.baths),
                minSqMt: toNumOrUndef(value.minSqMt),
                maxSqMt: toNumOrUndef(value.maxSqMt),
                minLotSize: toNumOrUndef(value.minLotSize),
                maxLotSize: toNumOrUndef(value.maxLotSize),
                minYearBuilt: toNumOrUndef(value.minYearBuilt),
                propType: (value.propType || undefined) as TListingSearch["propType"],
            };
            navigate({
                search: (prev) => ({ ...prev, ...next, page: undefined }),
                replace: true,
            });
            setOpen(false);
        },
    });

    const clearAll = () => {
        form.reset();
        navigate({
            search: (prev) => ({ q: prev.q }),
            replace: true,
        });
        setOpen(false);
    };

    const labelClass = "block text-[10px] font-sans font-bold text-primary uppercase tracking-[0.1em] ml-1";
    const inputClass = "w-full h-11 px-3 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium transition-all";
    const selectTriggerClass = "w-full !h-11 px-3 bg-white border border-outline-variant rounded-xl text-sm font-medium";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    aria-label="Abrir filtros"
                    className="h-12 w-12 bg-white border border-outline-variant text-on-surface rounded-xl flex items-center justify-center transition-all active:scale-95 hover:bg-surface-container"
                >
                    <SlidersHorizontal />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg bg-surface-container-lowest max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-sans font-extrabold text-on-surface text-2xl">Filtros</DialogTitle>
                    <DialogDescription className="text-on-surface-variant text-sm">
                        Ajusta los filtros para encontrar propiedades que se adapten a tus necesidades.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-5"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <div>
                        <p className={labelClass}>Precio (MXN)</p>
                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <form.Field
                                name="minPrice"
                                children={(field) => (
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        placeholder="Min"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className={inputClass}
                                    />
                                )}
                            />
                            <form.Field
                                name="maxPrice"
                                children={(field) => (
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        placeholder="Max"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className={inputClass}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <form.Field
                            name="beds"
                            children={(field) => (
                                <div className="space-y-1">
                                    <Label htmlFor={field.name} className={labelClass}>Habitaciones</Label>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(v) => field.handleChange(v === "any" ? "" : v)}
                                    >
                                        <SelectTrigger id={field.name} className={selectTriggerClass}>
                                            <SelectValue placeholder="Cualquiera" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Cualquiera</SelectItem>
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <SelectItem key={n} value={n.toString()}>{n}+</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        />
                        <form.Field
                            name="baths"
                            children={(field) => (
                                <div className="space-y-1">
                                    <Label htmlFor={field.name} className={labelClass}>Baños</Label>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(v) => field.handleChange(v === "any" ? "" : v)}
                                    >
                                        <SelectTrigger id={field.name} className={selectTriggerClass}>
                                            <SelectValue placeholder="Cualquiera" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Cualquiera</SelectItem>
                                            {[1, 2, 3, 4].map((n) => (
                                                <SelectItem key={n} value={n.toString()}>{n}+</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        />
                    </div>

                    <div>
                        <p className={labelClass}>Área construida (m²)</p>
                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <form.Field
                                name="minSqMt"
                                children={(field) => (
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        placeholder="Min"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className={inputClass}
                                    />
                                )}
                            />
                            <form.Field
                                name="maxSqMt"
                                children={(field) => (
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        placeholder="Max"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className={inputClass}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div>
                        <p className={labelClass}>Tamaño del terreno (m²)</p>
                        <div className="grid grid-cols-2 gap-3 mt-1">
                            <form.Field
                                name="minLotSize"
                                children={(field) => (
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        placeholder="Min"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className={inputClass}
                                    />
                                )}
                            />
                            <form.Field
                                name="maxLotSize"
                                children={(field) => (
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        placeholder="Max"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className={inputClass}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <form.Field
                            name="propType"
                            children={(field) => (
                                <div className="space-y-1">
                                    <Label htmlFor={field.name} className={labelClass}>Tipo de propiedad</Label>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(v) => field.handleChange(v === "any" ? "" : v)}
                                    >
                                        <SelectTrigger id={field.name} className={selectTriggerClass}>
                                            <SelectValue placeholder="Cualquiera" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="any">Cualquiera</SelectItem>
                                            <SelectItem value="casa">Casa</SelectItem>
                                            <SelectItem value="apartamento">Apartamento</SelectItem>
                                            <SelectItem value="terreno">Terreno</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        />
                        <form.Field
                            name="minYearBuilt"
                            children={(field) => (
                                <div className="space-y-1">
                                    <Label htmlFor={field.name} className={labelClass}>Año min. de construcción</Label>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        placeholder="Ej. 2010"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            )}
                        />
                    </div>

                    <Separator className="bg-outline-variant/40" />

                    <DialogFooter className="flex flex-row justify-between gap-2 sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={clearAll}
                            className="border-outline-variant"
                        >
                            Limpiar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-sbr-blue to-primary-container text-primary-foreground font-sans font-bold rounded shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
                        >
                            Aplicar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function PropertyListing({ contract, filters }: { contract: string, filters: Partial<TPropertyFilters> }) {
    const { data } = useSuspenseQuery(
        getPropertyListingOpts({
            ...filters,
            // @ts-ignore
            contract,
        }),
    );

    return (
        <div className="p-3 sm:p-6 lg:px-8 lg:py-12 xl:py-16 bg-surface-container">
            <div className="max-w-7xl grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-auto gap-12 sm:gap-y-6 mx-auto">
                {
                    data.properties?.length === 0 ?
                        <div className="w-full max-w-lg">
                            <p>No se encontraron propiedades para la búsqueda ingresada.</p>
                        </div> : data.properties.map((prop) => (
                            <div className="w-full max-w-lg" key={prop.id}>
                                {/* <PropertyCard key={prop.id} propData={prop} withMap={!!prop.lat && !!prop.lon} /> */}
                                <NewPropertyCard property={prop} />
                            </div>
                        ))
                }
            </div>
            <Pagination pagination={data.pagination} />
        </div>
    );
}

function buildPageItems(current: number, totalPages: number): (number | "ellipsis-left" | "ellipsis-right")[] {
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

function Pagination({ pagination }: { pagination: TPagination }) {
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

function PropertyListingLoading() {
    return (
        <div className="flex flex-col items-center justify-center h-full py-16">
            <LoadingCircles className="text-primary-container" />
            <p className="text-xl">Cargando...</p>
        </div>
    );
}

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();
    const { contract } = Route.useParams();
    const search = Route.useSearch();

    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplementProps({ complementType: "search" });
    }, []);

    return (
        <main className="relative">
            <section className="max-w-7xl mx-auto p-6 py-8 animate-fade-up">
                <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-3">
                    Propiedades en {contract}
                </h2>
                <p className="font-body text-on-surface-variant text-sm leading-relaxed max-w-[90%]">
                    Explora nuestra colección de propiedades arquitectónicas, donde diseño sofisticado y lujoso se
                    muestran en un mundo de lujo.
                </p>
            </section>
            <FilterSection />
            <Suspense fallback={<PropertyListingLoading />}>
                <PropertyListing contract={contract} filters={searchToFilters(search)} />
            </Suspense>
        </main>
    );
}
