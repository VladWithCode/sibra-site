import { SearchBox } from '@/components/SearchBox';
import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SecondaryLinkButton } from '@/components/sibra_buttons';

export const Route = createFileRoute('/_public/')({
    component: RouteComponent,
})

function RouteComponent() {
    const onSearch = (search: string) => {
        console.log(search);
    }

    return (
        <main>
            <section className="relative z-0">
                <div className="absolute inset-0 z-0">
                    <img className="h-full max-w-full object-cover object-center" src="/hero.png" alt="" />
                </div>
                <div className="relative z-10 bg-linear-to-b from-gray-700/80 to-45% to-gray-700/30 py-24 px-6 space-y-6">
                    <h1 className="text-4xl text-gray-50 font-medium tracking-tight leading-14">
                        Casas en todo <span className="font-semibold font-serif">Durango</span>
                    </h1>
                    <SearchBox placeholder="Buscar por domicilio, tipo de casa, C.P., etc" onSubmit={onSearch} />
                </div>
            </section>
            <section className="relative flex gap-6 justify-between px-6 py-8 z-0">
                <div className="basis-2/5">
                    <div className="bg-gray-100 rounded-lg w-full h-full"></div>
                </div>
                <div className="basis-full grow-0 shrink space-y-3">
                    <h2 className="text-2xl font-semibold">Obtén la Sibra app</h2>
                    <p className="text-current/60">
                        Registrate y obtén acceso anticipado a la aplicación móvil.
                        En ella podrás buscar, comprar y vender propiedades
                    </p>
                    <Button className="font-medium bg-sbr-blue" size="lg" asChild>
                        <Link to="/sibra-app">Obtener la app</Link>
                    </Button>
                </div>
            </section>
            <section className="relative z-0 px-6 py-12 space-y-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold">Últimas propiedades en oferta</h2>
                    <p className="text-current/60">Oportunidades únicas</p>
                </div>
                <PropertyCarousel />
            </section>
            <section className="relative z-0 bg-gray-200 px-6 py-12 space-y-6">
                <h2 className="sr-only">Nuestros servicios</h2>
                <div className="grid grid-cols-1 auto-rows-auto gap-6">
                    <Card>
                        <CardContent className="space-y-4">
                            <div className="w-40 aspect-square bg-gray-200 rounded-full mx-auto"></div>
                            <h3 className="text-2xl font-bold text-center">Desarrollos</h3>
                            <p className="text-current/60 px-6">
                                Encuentra un lugar para tu familia o conoce los desarrollos que el equipo de <span className="font-bold text-sbr-blue-light/80">SIBRA</span> tiene en la ciudad.
                            </p>
                            <div className="flex justify-center">
                                <SecondaryLinkButton label="Más Información" to="/" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="space-y-4">
                            <div className="w-40 aspect-square bg-gray-200 rounded-full mx-auto"></div>
                            <h3 className="text-2xl font-bold text-center">Comprar</h3>
                            <p className="text-current/60 px-6">
                                ¿Buscas una casa, apartamento o alguna vivienda para ti y tu familia?
                                ¡En <span className="font-bold text-sbr-blue-light/80">SIBRA</span> tenemos las mejores opciones para que encuentres la casa de tus sueños!
                            </p>
                            <div className="flex justify-center">
                                <SecondaryLinkButton label="Explorar Propiedades" to="/" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="space-y-4">
                            <div className="w-40 aspect-square bg-gray-200 rounded-full mx-auto"></div>
                            <h3 className="text-2xl font-bold text-center">Vender</h3>
                            <p className="text-current/60 px-6">
                                Si lo que buscas es vender tu propiedad, <span className="font-bold text-sbr-blue-light/80">SIBRA</span> es tu solución inteligente.
                                Con nuestra plataforma, podrás vender tu casa, apartamento o vivienda de manera rápida y sencilla.
                            </p>
                            <div className="flex justify-center">
                                <SecondaryLinkButton label="Contactar con un Agente" to="/" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="space-y-4">
                            <div className="w-40 aspect-square bg-gray-200 rounded-full mx-auto"></div>
                            <h3 className="text-2xl font-bold text-center">Precalificaciones</h3>
                            <p className="text-current/60 px-6">
                                En <span className="font-bold text-sbr-blue-light/80">SIBRA</span>, estamos comprometidos en ayudarte a encontrar la vivienda de tus sueños.
                                Por eso, te asesoramos y apoyamos en todo el proceso para financiar tu casa.
                            </p>
                            <div className="flex justify-center">
                                <SecondaryLinkButton label="Solicitar Precalificación" to="/" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
            <section className="relative z-0">
                <div className="absolute inset-0 z-0">
                    <img className="w-full max-h-full object-cover object-center" src="/sample.webp" alt="" />
                </div>
                <div className="relative z-10 text-gray-100 text-center bg-linear-to-br from-sbr-blue-dark/60 to-sbr-blue/60 px-6 pt-24 py-18 space-y-1">
                    <h2 className="relative text-3xl font-semibold">
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 text-8xl text-red-600">"</span>
                        <span>Tu solución inteligente en bienes raíces"</span>
                    </h2>
                    <p className="text-xl font-medium">SIBRA</p>
                </div>
            </section>
        </main>
    );
}

function PropertyCarousel() {
    const [properties, setProperties] = useState<string[]>([])
    const [currentProperty, setCurrentProperty] = useState("")
    const [api, setApi] = useState<CarouselApi>()
    const selectSlideCb = useCallback((api: CarouselApi) => {
        if (!api) return
        setCurrentProperty(String(api.selectedScrollSnap() + 1))
    }, [])

    useEffect(() => {
        for (let i = 0; i < 10; i++) {
            setProperties((prev) => [...prev, (i + 1).toString()])
        }
        setCurrentProperty("1")

        return () => {
            setProperties([])
            setCurrentProperty("")
        }
    }, [])

    useEffect(() => {
        if (!api) return

        api.on("select", selectSlideCb)
    }, [api])

    return (
        <Carousel className="space-y-3" setApi={setApi}>
            <CarouselContent>
                {properties.map((property) => (
                    <PropertyCarouselItem key={property}>
                        {property}
                    </PropertyCarouselItem>
                ))}
            </CarouselContent>
            {/* <CarouselPrevious className="-left-5 bg-sbr-blue text-white" />
            <CarouselNext className="-right-5 bg-sbr-blue text-white" /> */}
            <div className="flex items-center justify-center gap-1.5">
                {properties.map((property) => (
                    <div
                        key={property}
                        className="rounded-full size-2 bg-gray-400 data-[state=active]:bg-sbr-blue data-[state=inactive]:bg-gray-400 transition-colors"
                        data-state={property === currentProperty ? "active" : "inactive"}
                    ></div>
                ))}
            </div>
        </Carousel>
    );
}

function PropertyCarouselItem({ children }: {} & PropsWithChildren) {
    return (
        <CarouselItem className="not-first:pl-6 basis-3/4 aspect-[3/2]">
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                {children}
            </div>
        </CarouselItem>
    );
}
