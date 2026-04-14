import { useNavigate } from "@tanstack/react-router";
import { List, MapIcon, Search, SlidersHorizontal } from "lucide-react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import z from "zod";
import { useForm } from "@tanstack/react-form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import type { TPropertyFilters } from "@/queries/type";
import { getPropertyListingOpts } from "@/queries/properties";
import { useSuspenseQuery } from "@tanstack/react-query";
import { LoadingCircles } from "../icons/loadingCircles";
import { useInView } from "motion/react";

export const PropertyListingSearchSchema = z.object({
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

type TListingSearch = z.infer<typeof PropertyListingSearchSchema>;

export function FiltersDialog({ filters }: { filters: z.infer<typeof PropertyListingSearchSchema> }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const form = useForm({
        defaultValues: {
            minPrice: filters.minPrice?.toString() ?? "",
            maxPrice: filters.maxPrice?.toString() ?? "",
            beds: filters.beds?.toString() ?? "",
            baths: filters.baths?.toString() ?? "",
            minSqMt: filters.minSqMt?.toString() ?? "",
            maxSqMt: filters.maxSqMt?.toString() ?? "",
            minLotSize: filters.minLotSize?.toString() ?? "",
            maxLotSize: filters.maxLotSize?.toString() ?? "",
            minYearBuilt: filters.minYearBuilt?.toString() ?? "",
            propType: filters.propType ?? "",
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

export function FilterSection({ filters }: { filters: Partial<TPropertyFilters> }) {
    const navigate = useNavigate();

    const [search, setSearch] = useState(filters.textSearch ?? "");
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
                <FiltersDialog filters={filters} />
            </div>
        </>
    );
}

export function propertyListingSearchToFilters(search: TListingSearch): Partial<TPropertyFilters> {
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
