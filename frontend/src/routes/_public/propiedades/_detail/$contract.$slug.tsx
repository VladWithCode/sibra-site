import { ShareIcon, SqMtIcon } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import { FormatMoney } from "@/lib/format";
import { PropertyLocationMap } from "@/maps";
import { getPropertyBySlugOpts } from "@/queries/properties";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bed, Info, Toilet } from "lucide-react";
import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { PropertyImageCarousel } from "@/components/properties/PropertyImageCarousel";
import { PropertyCarousel } from "@/components/properties/PropertySlider";
import { LikeButton } from "@/components/properties/likeButton";
import { ContactForm, ContactFormDialog } from "@/components/contact/ContactForm";

export const Route = createFileRoute("/_public/propiedades/_detail/$contract/$slug")({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(
            getPropertyBySlugOpts(params.slug, params.contract),
        );
    },
});

function RouteComponent() {
    const { slug, contract } = Route.useParams();
    const { data } = useSuspenseQuery(getPropertyBySlugOpts(slug, contract));
    const property = data.property;

    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();
    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplementProps({ complementType: "search" });
    }, []);

    return (
        <main className="col-start-1 col-span-1 w-full">
            <div className="relative w-full aspect-[3/2]">
                <div className="relative w-full h-full z-0 overflow-hidden">
                    {property.imgs?.length > 0 ? (
                        <PropertyImageCarousel property={property} />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                            <p className="text-lg font-semibold text-center text-muted-foreground">
                                No hay imágenes disponibles
                            </p>
                        </div>
                    )}
                </div>
                <div className="absolute top-0 right-0 flex gap-3 p-3">
                    <Button
                        className="rounded-full p-5 text-muted-foreground bg-gray-50 shadow-sm"
                        variant="secondary"
                        size="icon"
                    >
                        <ShareIcon className="size-5" />
                    </Button>
                    <LikeButton className="rounded-full p-5 text-muted-foreground bg-gray-50 shadow-sm" propData={property} />
                </div>
            </div>
            <div className="bg-gray-200 text-gray-800 px-6 py-3 space-y-3 overflow-hidden">
                <p className="flex items-center gap-3 uppercase text-sm text-current/60 font-bold">
                    <span className="block w-4 aspect-square bg-sbr-green rounded-full"></span>
                    {property.contract}
                </p>
                <p className="text-3xl font-bold">{FormatMoney(property.price)}</p>
                <ul className="flex items-center gap-3 text-sm xs:text-base text-current/80">
                    <li className="flex items-center gap-1.5 font-bold align-bottom">
                        <span>{property.beds} Req.</span>
                        <span>
                            <Bed />{" "}
                        </span>
                    </li>
                    <span className="block w-2 aspect-square rounded-full bg-gray-500"></span>
                    <li className="flex items-center gap-1.5 font-bold align-bottom">
                        <span>{property.baths} Baños</span>
                        <span>
                            <Toilet />{" "}
                        </span>
                    </li>
                    <span className="block w-2 aspect-square rounded-full bg-gray-500"></span>
                    <li className="flex items-center gap-1.5 font-bold align-bottom">
                        <span>{property.sqMt} Mt²</span>
                        <span>
                            <SqMtIcon />{" "}
                        </span>
                    </li>
                </ul>
                <h1 className="text-sm font-medium text-current/60">
                    {property.address}, C.P. {property.zip}, {property.nbHood}. {property.city},{" "}
                    {property.state}
                </h1>
                <p className="text-destructive font-semibold">
                    <a className="flex items-center gap-1" href="https://infonavit.com">
                        Puntos Infonavit
                        <Info className="size-4 fill-destructive stroke-gray-50" />
                    </a>
                </p>
                <div className="bg-gray-50 border-2 border-sbr-green rounded-lg px-3 py-6">
                    <ContactFormDialog forPropertyID={property.id}>
                        <Button
                            className="flex-col items-start text-base text-start whitespace-normal p-0 h-auto"
                            variant="ghost"
                        >
                            <h3 className="text-lg font-bold">Detalles de la casa</h3>
                            <p className="text-current/60">{property.description}</p>
                        </Button>
                    </ContactFormDialog>
                </div>
                <div className="relative z-0 bg-gray-50 border-2 border-sbr-green rounded-lg overflow-hidden">
                    <h3 className="absolute top-3 left-3 z-10 bg-gray-50 rounded text-lg font-bold px-1.5 shadow-md">
                        Mapa
                    </h3>
                    <div className="w-full aspect-[3/2] p-0.5 rounded-lg">
                        {!!property.lat && !!property.lon ? (
                            <PropertyLocationMap property={property} fullscreenControl={true} />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-gray-100">
                                <p className="text-lg font-semibold text-center text-muted-foreground">
                                    Pronto agregaremos la ubicación de la propiedad
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="relative bg-gray-50 border-2 border-sbr-green rounded-lg px-3 py-6 space-y-3 z-0">
                    <h3 className="text-lg font-bold">¿Quieres conocerla?</h3>
                    <ContactForm viewDetail="simple" forPropertyID={property.id} />
                </div>
                <div className="flex justify-between border-y-2 border-sbr-green font-semibold text-center">
                    <h3 className="flex-1 text-lg py-2 px-4">Llama ahora</h3>
                    <span className="shrink-0 grow-0 basis-0.5 bg-sbr-green-light my-2"></span>
                    <a href="tel:526188744569" className="flex-1 py-2 px-4">
                        (618) 874 45 69
                    </a>
                </div>
                <div className="space-y-3">
                    <h3 className="text-lg font-bold">Propiedades recomendadas</h3>
                    {data.nearbyProperties ? (
                        <PropertyCarousel properties={data.nearbyProperties} />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100 p-3 rounded-lg shadow">
                            <p className="font-semibold text-center text-muted-foreground">
                                Parece que no encontramos más propiedades similares.
                            </p>
                        </div>
                    )}
                </div>
                <div className="space-y-3">
                    <h3 className="text-lg font-bold">Propiedades cercanas</h3>
                    {data.nearbyProperties ? (
                        <PropertyCarousel properties={data.nearbyProperties} />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100 p-3 rounded-lg shadow">
                            <p className="font-semibold text-center text-muted-foreground">
                                Parece que no encontramos más propiedades cercanas.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
