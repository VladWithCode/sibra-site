import { PropertyCard } from "@/components/properties/PropertyCard";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getPropertyListingOpts } from "@/queries/properties";
import { useUIStore } from "@/stores/uiStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_public/propiedades/_listing/$contract")({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        const { contract } = params;
        await context.queryClient.ensureQueryData(
            getPropertyListingOpts({
                contract,
            }),
        );
    },
});

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();
    const { contract } = Route.useParams();
    const { data } = useSuspenseQuery(
        getPropertyListingOpts({
            contract,
        }),
    );

    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplementProps({ complementType: "search" });
    }, []);

    return (
        <main>
            <div className="flex p-3 sm:px-6 lg:px-8 border-b border-gray-200">
                <h1 className="w-full max-w-6xl text-sm md:text-base font-medium text-muted-foreground mx-auto">Propiedades en {contract}</h1>
            </div>
            <div className="w-full max-w-6xl flex items-center px-3 sm:px-6 lg:px-8 xl:px-0 py-1.5 sm:py-2 font-medium mx-auto">
                <p className="whitespace-nowrap text-current/80 text-sm sm:text-base">
                    <span className="text-2xl sm:text-4xl">{data.pagination.total} </span>
                    resultados
                </p>
                <Select defaultValue="listing_date-desc">
                    <SelectTrigger className="sm:text-base font-semibold ml-auto border-transparent active:border-primary-foreground whitespace-break-spaces line-clamp-1">
                        <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Ordenar por</SelectLabel>
                            <SelectItem value="listing_date-desc">Fecha Reciente</SelectItem>
                            <SelectItem value="listing_date-asc">Fecha Antigua</SelectItem>
                            <SelectItem value="price-desc">Precio Más Alto</SelectItem>
                            <SelectItem value="price-asc">Precio Más Bajo</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <div className="shrink-0 basis-min">
                    <Button className="sm:text-base font-semibold" variant="ghost">
                        <MapPin className="size-6" />
                        Mapa
                    </Button>
                </div>
            </div>
            <div className="p-3 sm:p-6 lg:px-8 lg:py-12 xl:py-16 bg-gray-200">
                <div className="max-w-6xl grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-auto gap-4 sm:gap-y-6 mx-auto">
                    {data.properties.map((prop) => (
                        <div className="w-full max-w-lg">
                            <PropertyCard key={prop.id} propData={prop} withMap={false} />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
