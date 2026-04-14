import { PropertyListing, PropertyListingLoading } from "@/components/properties/PropertyListing";
import { FilterSection, PropertyListingSearchSchema, propertyListingSearchToFilters } from "@/components/properties/PropertyListingFilters";
import { getPropertyListingOpts } from "@/queries/properties";
import { useUIStore } from "@/stores/uiStore";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useEffect } from "react";

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
            <FilterSection contract={contract} filters={filters} />
            <Suspense fallback={<PropertyListingLoading />}>
                <PropertyListing contract={contract} filters={propertyListingSearchToFilters(filters)} />
            </Suspense>
        </main>
    );
}
