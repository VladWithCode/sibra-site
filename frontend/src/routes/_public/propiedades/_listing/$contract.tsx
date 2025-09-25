import { PropertyCard } from '@/components/properties/PropertyCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPropertyListingOpts } from '@/queries/properties';
import { useUIStore } from '@/stores/uiStore';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, MapPin } from 'lucide-react';
import { useEffect } from 'react';

export const Route = createFileRoute('/_public/propiedades/_listing/$contract')({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        const { contract } = params
        await context.queryClient.ensureQueryData(
            getPropertyListingOpts({
                contract,
            })
        );
    },
})

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplement } = useUIStore();
    const { contract } = Route.useParams();
    const { data } = useSuspenseQuery(getPropertyListingOpts({
        contract,
    }));

    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplement('search');
    }, []);

    return (
        <>
            <div className="flex p-3 border-b border-gray-200">
                <h1 className="text-sm font-medium">Propiedades en {contract}</h1>
            </div>
            <div className="flex items-center px-3 py-1.5 font-medium">
                <p className="whitespace-nowrap text-muted-foreground text-sm">
                    <span className="text-2xl">{data.pagination.total} </span>
                    resultados
                </p>
                <Select defaultValue='listing_date-desc'>
                    <SelectTrigger className="font-semibold ml-auto border-transparent active:border-primary-foreground whitespace-break-spaces line-clamp-1">
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
                    <Button className="font-semibold" variant="ghost">
                        <MapPin className="size-6" />
                        Mapa
                    </Button>
                </div>
            </div >
            <div className="p-3 space-y-3 bg-gray-200">
                {data.properties.map(prop => (
                    <PropertyCard key={prop.id} propData={prop} withMap={false} />
                ))}
            </div>
        </>
    );
}
