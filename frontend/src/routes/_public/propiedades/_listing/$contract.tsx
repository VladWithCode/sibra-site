import { LoadingCircles } from "@/components/icons/loadingCircles";
import { NewPropertyCard } from "@/components/properties/PropertyCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPropertyListingOpts } from "@/queries/properties";
import type { TProperty, TPropertyFilters } from "@/queries/type";
import { useUIStore } from "@/stores/uiStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { List, MapIcon, Search, SlidersHorizontal } from "lucide-react";
import { useInView } from "motion/react";
import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import z from "zod";

const searchSchema = z.object({
    q: z.string().optional().catch(""),
});

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
    const { q } = Route.useSearch();
    const { data } = useSuspenseQuery(getPropertyListingOpts({
        // @ts-ignore
        contract,
        textSearch: q ?? "",
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
                search: { q: value || undefined },
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
                        <button className="h-12 w-12 bg-white border border-outline-variant text-on-surface rounded-xl flex items-center justify-center transition-all active:scale-95 hover:bg-surface-container">
                            <SlidersHorizontal />
                        </button>
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

function PropertyListing({ contract, filters }: { contract: string, filters: Partial<TPropertyFilters> }) {
    const { data } = useSuspenseQuery(
        getPropertyListingOpts({
            ...filters,
            // @ts-ignore
            contract,
        }),
    );

    return (
        <>
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
        </>
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
    const { q } = Route.useSearch();

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
            <div className="p-3 sm:p-6 lg:px-8 lg:py-12 xl:py-16 bg-surface-container">
                <Suspense fallback={<PropertyListingLoading />}>
                    <PropertyListing contract={contract} filters={{ textSearch: q ?? "" }} />
                </Suspense>
            </div>
        </main>
    );
}
