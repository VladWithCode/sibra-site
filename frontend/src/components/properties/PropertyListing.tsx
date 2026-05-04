import { getPropertyFilteredListingOpts } from "@/queries/properties";
import type { TPropertyFilters } from "@/queries/type";
import { useSuspenseQuery } from "@tanstack/react-query";
import { NewPropertyCard } from "./PropertyCard";
import { Pagination } from "../Pagination";
import { LoadingCircles } from "../icons/loadingCircles";


export function PropertyListing({ filters }: { filters: Partial<TPropertyFilters> }) {
    const { data } = useSuspenseQuery(
        getPropertyFilteredListingOpts(filters),
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
                                <NewPropertyCard property={prop} />
                            </div>
                        ))
                }
            </div>
            <Pagination pagination={data.pagination} />
        </div>
    );
}

export function PropertyListingLoading() {
    return (
        <div className="flex flex-col items-center justify-center h-full py-16">
            <LoadingCircles className="text-primary-container" />
            <p className="text-xl">Cargando...</p>
        </div>
    );
}
