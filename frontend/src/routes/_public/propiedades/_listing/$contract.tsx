import { LoadingCircles } from "@/components/icons/loadingCircles";
import { PropertyListing, PropertyListingLoading } from "@/components/properties/PropertyListing";
import { FilterSection, PropertyListingSearchSchema, propertyListingSearchToFilters } from "@/components/properties/PropertyListingFilters";
import { getPropertyListingOpts } from "@/queries/properties";
import type { TPropertyFilters } from "@/queries/type";
import { useUIStore } from "@/stores/uiStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { List, MapIcon } from "lucide-react";
import { useInView } from "motion/react";
import { Suspense, useEffect, useRef } from "react";

export const Route = createFileRoute("/_public/propiedades/_listing/$contract")({
    component: RouteComponent,
    validateSearch: (search) => PropertyListingSearchSchema.parse(search),
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

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplementProps, setHeaderQuickStick } = useUIStore();
    const { contract } = Route.useParams();
    const filters = Route.useSearch();

    const sentinelRef = useRef<HTMLDivElement>(null);
    const isSentinelInView = useInView(sentinelRef, {
        margin: "0px 0px 0px 0px",
    });

    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplementProps({ complementType: "search" });
        setHeaderQuickStick(true);
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
            <div ref={sentinelRef} className="relative h-0 overflow-hidden pointer-events-none" aria-hidden />
            <section
                className="sticky top-0 inset-x-0 z-30 translate-y-0 data-[stuck=true]:translate-y-(--header-height) bg-surface-container-high/0 data-[stuck=true]:bg-surface-container-high transition-[transform,translate,background] group data-[stuck=true]:shadow-md"
                data-stuck={!isSentinelInView}
            >
                <div className="max-w-7xl mx-auto bg-surface-container/0 group-data-[sticky=true]:bg-surface-container px-6 py-3 space-y-4">
                    <FilterSection filters={filters} />
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
                            <ResultCount contract={contract} filters={filters} />
                        </Suspense>
                    </div>
                </div>
            </section>
            <Suspense fallback={<PropertyListingLoading />}>
                <PropertyListing contract={contract} filters={propertyListingSearchToFilters(filters)} />
            </Suspense>
        </main>
    );
}

function ResultCount({ contract, filters }: { contract: string, filters: Partial<TPropertyFilters> }) {
    const { data } = useSuspenseQuery(getPropertyListingOpts({
        // @ts-ignore
        contract,
        ...propertyListingSearchToFilters(filters),
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
