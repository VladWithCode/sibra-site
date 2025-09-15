import { SearchBox } from '@/components/SearchBox';
import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { useCallback, useEffect, useState, type PropsWithChildren } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import heroImg from '../../../public/hero.png';
import aboutImg from '../../../public/sample.webp';
import agentImg2 from '../../../public/agent_showcase_2.jpg';
import { Clock, Phone } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecondaryLinkButton } from '@/components/sibra_buttons';
import { ConnectIcon } from '@/components/icons/connect';
import { FacebookIcon } from '@/components/icons/facebook';
import { InstagramIcon } from '@/components/icons/instagram';
import { ImgPlaceholder } from '@/components/ui/img-placeholder';

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
                    <img className="h-full max-w-full object-cover object-center" src={heroImg} alt="" />
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
                    <img className="w-full max-h-full object-cover object-center" src={aboutImg} alt="" />
                </div>
                <div className="relative z-10 text-gray-100 text-center bg-linear-to-br from-sbr-blue-dark/60 to-sbr-blue/60 px-6 pt-24 py-18 space-y-1">
                    <h2 className="relative text-3xl font-semibold">
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 text-8xl text-red-600">"</span>
                        <span>Tu solución inteligente en bienes raíces"</span>
                    </h2>
                    <p className="text-xl font-medium">SIBRA</p>
                </div>
            </section>
            <section className="relative z-0 py-16 px-6">
                <div className="absolute z-0 inset-0">
                    <img className="h-full max-w-full object-cover object-center brightness-80" src={agentImg2} alt="" />
                </div>
                <div className="relative z-10 text-gray-100 text-center bg-sbr-blue-light/20 backdrop-blur rounded-lg space-y-4 p-6">
                    <h2 className="text-4xl font-semibold">Contáctanos</h2>
                    <div className="space-y-0.5">
                        <p className="text-xl font-medium">Estamos a tus ordenes.</p>
                        <h3 className="text-xl font-medium">Servicio al cliente en los horarios:</h3>
                        <div className="grid grid-cols-[auto_1fr] gap-3 pt-4 px-8">
                            <div className="col-span-full grid grid-cols-subgrid">
                                <div className="col-start-1 flex flex-col items-center gap-1">
                                    <div className="text-xs font-semibold">Lun-Vie</div>
                                    <Clock className="size-6" />
                                </div>
                                <div className="col-start-2 text-xl ml-auto mt-auto">10:00 am - 07:00 pm</div>
                            </div>
                            <div className="col-span-full grid grid-cols-subgrid">
                                <div className="col-start-1 flex flex-col items-center gap-1">
                                    <div className="text-xs font-semibold">Sáb</div>
                                    <Clock className="size-6" />
                                </div>
                                <div className="col-start-2 text-xl ml-auto mt-auto">10:00 am - 02:00 pm</div>
                            </div>
                        </div>
                        <h3 className="text-xl font-medium mt-6">Llamanos o manda Whatsapp a los números:</h3>
                        <div className="grid grid-cols-[auto_1fr] gap-3 pt-4 px-8">
                            <div className="col-span-full grid grid-cols-subgrid">
                                <div className="col-start-1 flex flex-col items-center gap-1">
                                    <div className="text-xs font-semibold">Mazatlán</div>
                                    <Phone className="size-6" />
                                </div>
                                <div className="col-start-2 text-xl ml-4 mr-auto mt-auto">(669) 112-9742</div>
                            </div>
                            <div className="col-span-full grid grid-cols-subgrid">
                                <div className="col-start-1 flex flex-col items-center gap-1">
                                    <div className="text-xs font-semibold">Durango</div>
                                    <Phone className="size-6" />
                                </div>
                                <div className="col-start-2 text-xl ml-4 mr-auto mt-auto">(618) 194-1145</div>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col space-y-3">
                            <Button size="lg" className="bg-sbr-blue hover:bg-gray-50 active:bg-gray-50 hover:text-sbr-blue active:text-sbr-blue" asChild>
                                <Link to="/agentes">Contactar con un Agente</Link>
                            </Button>
                            <Button size="lg" className="bg-sbr-green hover:bg-gray-50 active:bg-gray-50 hover:text-sbr-green active:text-sbr-green" asChild>
                                <Link to="https://w.me/6181941145?text=¡Hola! Me gustaría hablar con un agente SIBRA.">Enviar un Whatsapp</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
            <section className="relative z-0 px-6 py-12 space-y-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold">Encuentranos</h2>
                    <p className="text-current/60">Puedes encontrar nuestras oficinas en los siguientes domicilios:</p>
                </div>
                <div className="w-full aspect-[3/2] rounded-lg">
                    <Tabs defaultValue="dgo" className="w-full">
                        <TabsList>
                            <TabsTrigger value="dgo">Durango</TabsTrigger>
                            <TabsTrigger value="mzt">Mazatlán</TabsTrigger>
                        </TabsList>
                        <TabsContent value="dgo">
                            <p className="text-current/60 mb-3">Domicilio: C. Cancer #132. Fracc. Sahop, 34190 Durango, Dgo.</p>
                            <Card className="p-0 rounded-lg overflow-hidden">
                                <CardContent className="p-0">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3644.8457070902837!2d-104.66324402462155!3d24.001224979100773!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x869bc7ffdb768fa5%3A0x2ab21e09ae62252f!2sC%C3%A1ncer%20132%2C%20Sahop%2C%2034190%20Durango%2C%20Dgo.!5e0!3m2!1sen!2smx!4v1757905868906!5m2!1sen!2smx"
                                        width="400"
                                        height="300"
                                        className="w-full object-cover border-0 rounded-lg"
                                        allowFullScreen={false}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade">
                                    </iframe>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="mzt">
                            <p className="text-current/60 mb-3">Domicilio: Av. Ejercito Mexicano 1102B, Sembradores de la Amistad, 82146 Mazatlán, Sin.</p>
                            <Card className="p-0 rounded-lg overflow-hidden">
                                <CardContent className="p-0">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3666.245102084866!2d-106.42603622464132!3d23.234166308398777!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x869f536e84530b25%3A0x35c1072887e44762!2sAv.%20Ej%C3%A9rcito%20Mexicano%201102B%2C%20Sembradores%20de%20la%20Amistad%2C%2082146%20Mazatl%C3%A1n%2C%20Sin.!5e0!3m2!1sen!2smx!4v1757906268437!5m2!1sen!2smx"
                                        width="400"
                                        height="300"
                                        className="w-full object-cover border-0 rounded-lg"
                                        allowFullScreen={false}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade">
                                    </iframe>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </section>
            <section className="relative z-0 bg-gray-200 px-6 py-12 space-y-6 text-current/80">
                <div className="text-center">
                    <ConnectIcon className="text-current/90 size-10 mx-auto" />
                </div>
                <h2 className="text-2xl font-semibold text-center">Conecta con nosotros</h2>
                <div className="flex gap-4 items-center justify-center">
                    <a href="https://www.instagram.com/sibra.durango/" target="_blank" rel="noreferrer">
                        <InstagramIcon className='size-8' />
                    </a>
                    <a href="https://www.facebook.com/sibra.durango/" target="_blank" rel="noreferrer">
                        <FacebookIcon className='size-8' />
                    </a>
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
