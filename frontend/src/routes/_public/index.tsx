import { SearchBox } from "@/components/SearchBox";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SecondaryLinkButton } from "@/components/sibra_buttons";
import { HomeIcon, LoanIcon, ProjectsIcon, SellHomeIcon } from "@/components/icons/icons";
import { getFeaturedPropertiesOpts } from "@/queries/properties";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PropertyCarousel } from "@/components/properties/PropertySlider";
import { useUIStore } from "@/stores/uiStore";
import { useEffect } from "react";

export const Route = createFileRoute("/_public/")({
    component: RouteComponent,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(getFeaturedPropertiesOpts);
    },
});

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();
    const { data: properties } = useSuspenseQuery(getFeaturedPropertiesOpts);
    const onSearch = (search: string) => {
        console.log(search);
    };

    useEffect(() => {
        setHeaderFloating(true);
        setHeaderComplementProps({ complementType: "none" });
    }, []);

    return (
        <main>
            <section className="relative z-0">
                <div className="absolute inset-0 z-0">
                    <img
                        className="h-full max-w-full md:w-full object-cover object-center"
                        src="/hero.png"
                        alt=""
                    />
                </div>
                <div className="relative z-10 bg-linear-to-b from-gray-700/80 to-45% sm:to-60% to-gray-700/50 py-24 sm:py-32 md:py-36 lg:py-56 xl:py-72 px-6 sm:px-12 md:px-16 xl:px-24">
                    <div className="max-w-4xl space-y-6 md:space-y-8 xl:space-y-16 mx-auto">
                        <h1 className="text-4xl md:text-5xl xl:text-7xl text-gray-50 font-medium tracking-tight leading-14">
                            Casas en todo <span className="font-semibold font-secondary">Durango</span>
                        </h1>
                        <SearchBox
                            placeholder="Buscar por domicilio, tipo de casa, C.P., etc"
                            onSubmit={onSearch}
                        />
                    </div>
                </div>
            </section>
            <section className="relative flex gap-6 max-w-6xl xl:gap-24 justify-between px-6 py-8 xl:py-32 z-0 mx-auto">
                <div className="basis-2/5 sm:basis-3/5 aspect-[3/4]">
                    <div className="bg-gray-100 rounded-lg w-full h-full"></div>
                </div>
                <div className="basis-full grow-0 shrink space-y-3">
                    <h2 className="text-2xl lg:text-4xl font-semibold">Obtén la Sibra app</h2>
                    <p className="lg:text-lg text-current/60">
                        Registrate y obtén acceso anticipado a la aplicación móvil. En ella
                        podrás buscar, comprar y vender propiedades
                    </p>
                    <Button className="lg:text-lg font-medium bg-sbr-blue py-6 px-12" size="lg" asChild>
                        <Link to="/sibra-app">Obtener la app</Link>
                    </Button>
                </div>
            </section>
            <section className="relative z-0 max-w-screen xl:max-w-6xl px-6 py-12 xl:py-32 space-y-6 overflow-hidden mx-auto">
                <div className="space-y-1">
                    <h2 className="text-2xl lg:text-4xl font-semibold">Últimas propiedades en oferta</h2>
                    <p className="lg:text-lg text-current/60">Oportunidades únicas</p>
                </div>
                <PropertyCarousel properties={properties} />
            </section>
            <section className="relative z-0 bg-gray-200 px-6 py-12 xl:py-32 2xl:py-56 space-y-6">
                <h2 className="sr-only">Nuestros servicios</h2>
                <div className="max-w-8xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-auto gap-6 xl:px-6 mx-auto">
                    {
                        serviceList.map(service => (
                            <Card className="w-full max-w-sm mx-auto">
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-center w-40 aspect-square text-sbr-green rounded-full mx-auto">
                                        <service.icon className="size-40 xl:size-32" />
                                    </div>
                                    <h3 className="text-2xl lg:text-3xl xl:text-2xl font-bold text-center">{service.title}</h3>
                                    <p className="xl:text-sm text-current/60 px-6">{service.description}</p>
                                    <div className="flex justify-center">
                                        <SecondaryLinkButton label="Más Información" to={service.link} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    }
                </div>
            </section>
            <section className="relative z-0">
                <div className="absolute inset-0 z-0">
                    <img
                        className="w-full h-full object-cover object-center"
                        src="/sample.webp"
                        alt=""
                    />
                </div>
                <div className="relative z-10 text-gray-100 text-center bg-linear-to-br from-sbr-blue-dark/60 to-sbr-blue/60 px-6 sm:px-8 pt-24 sm:pt-32 xl:pt-64 py-18 sm:py-24 xl:py-32 space-y-1 sm:space-y-3 xl:space-y-6">
                    <h2 className="relative text-3xl sm:text-4xl xl:text-5xl font-semibold">
                        <span className="absolute -top-12 xl:-top-16 left-1/2 -translate-x-1/2 text-8xl xl:text-9xl text-red-600">
                            "
                        </span>
                        <span>Tu solución inteligente en bienes raíces"</span>
                    </h2>
                    <p className="text-xl sm:text-2xl xl:text-3xl font-medium">SIBRA</p>
                </div>
            </section>
        </main>
    );
}

const serviceList = [
    {
        icon: ProjectsIcon,
        title: "Desarrollos",
        description: "Encuentra un lugar para tu familia o conoces los desarrollos que el equipo de SIBRA tiene en la ciudad.",
        link: "/proyectos",
    },
    {
        icon: HomeIcon,
        title: "Comprar",
        description: "¿Buscas una casa, apartamento o alguna vivienda para ti y tu familia? ¡En SIBRA tenemos las mejores opciones para que encuentres la casa de tus sueños!",
        link: "/propiedades/venta",
    },
    {
        icon: SellHomeIcon,
        title: "Vender",
        description: "Si lo que buscas es vender tu propiedad, SIBRA es tu solución inteligente. Con nuestra plataforma, podrás vender tu casa, apartamento o vivienda de manera rápida y sencilla.",
        link: "/vende-tu-casa",
    },
    {
        icon: LoanIcon,
        title: "Precalificaciones",
        description: "En SIBRA, estamos comprometidos en ayudarte a encontrar la vivienda de tus sueños. Por eso, te asesoramos y apoyamos en todo el proceso para financiar tu casa.",
        link: "/precalificaciones",
    },
]
