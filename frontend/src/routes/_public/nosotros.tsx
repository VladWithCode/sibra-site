import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ImgPlaceholder } from "@/components/ui/img-placeholder";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/nosotros")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <main>
            <section className="relative z-0">
                <div className="absolute z-0 inset-0">
                    <img
                        src="/sample.webp"
                        alt=""
                        className="h-full w-full object-cover object-center brightness-80"
                    />
                </div>
                <div className="relative z-10 bg-linear-to-b from-sbr-blue/60 to-sbr-blue/60 px-6 sm:px-8 lg:px-24 2xl:px-32 pt-28 sm:pt-40 lg:pt-48 2xl:pt-56 pb-16 sm:pb-24 2xl:pb-36">
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl 2xl:text-7xl text-gray-50 font-semibold sm:font-medium text-center tracking-tighter sm:tracking-tight">
                        "Tu solución inteligente en bienes raíces"
                    </h1>
                </div>
            </section>
            <section className="relative z-0 max-w-6xl px-6 sm:px-8 lg:px-16 py-12 sm:py-16 lg:py-24 space-y-12 xl:space-y-20 mx-auto">
                <div className="xl:flex items-center gap-8 xl:py-16 2xl:py-24 space-y-3 sm:space-y-8 xl:space-y-0">
                    <div className="flex-1 space-y-3 2xl:space-y-8">
                        <h2 className="text-2xl sm:text-3xl 2xl:text-5xl font-semibold">Nuestra esencia</h2>
                        <p className="text-current/60">
                            En SIBRA creemos que cada propiedad es mucho más que un inmueble: es el
                            inicio de una historia, un legado y una oportunidad de construir
                            confianza. Desde hace más de 26 años, hemos acompañado a miles de
                            familias en Durango a tomar decisiones inteligentes, simpre con cercanía
                            y compromiso real.
                        </p>
                    </div>
                    <div className="flex-1 w-full aspect-[3/2] bg-gray-200 rounded-lg">
                        <img
                            src="/agent_showcase.webp"
                            alt=""
                            className="w-full h-full object-cover object-center rounded-lg"
                        />
                    </div>
                </div>
                <div className="sm:grid grid-cols-2 gap-6 space-y-6 sm:space-y-0">
                    <Card className="bg-sbr-blue pt-0 overflow-hidden">
                        <CardHeader className="p-0">
                            {/* <img src="" alt="" className="w-full h-full object-cover object-center" /> */}
                            <ImgPlaceholder className="aspect-[2/1] rounded-b-none" />
                        </CardHeader>
                        <CardContent className="text-gray-50 space-y-1">
                            <CardTitle className="text-lg sm:text-xl font-bold">
                                Asesoría gratuita
                            </CardTitle>
                            <CardDescription className="text-current/60 font-medium">
                                Antes de comprar o vender, te orientamos para evitar errores
                                costosos.
                            </CardDescription>
                        </CardContent>
                    </Card>
                    <Card className="bg-sbr-blue pt-0 overflow-hidden">
                        <CardHeader className="p-0">
                            {/* <img src="" alt="" className="w-full h-full object-cover object-center" /> */}
                            <ImgPlaceholder className="aspect-[2/1] rounded-b-none" />
                        </CardHeader>
                        <CardContent className="text-gray-50 space-y-1">
                            <CardTitle className="text-lg sm:text-xl font-bold">
                                Transparencia absoluta
                            </CardTitle>
                            <CardDescription className="text-current/60 font-medium">
                                Procesos claros, contratos en regla, información siempre
                                disponible
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>
                <div className="2xl:py-12 space-y-6 2xl:space-y-12">
                    <h3 className="text-lg sm:text-2xl 2xl:text-3xl font-bold">Lo que recibes con SIBRA</h3>
                    <Carousel>
                        <CarouselContent className="pb-1">
                            {offerList.map((offer, idx) => (
                                <CarouselItem className="basis-3/4 sm:basis-1/2 xl:basis-2/5" key={idx}>
                                    <Card className="w-full bg-gray-50 pt-0 overflow-hidden">
                                        <CardHeader className="p-0">
                                            {/* <img src="" alt="" className="w-full h-full object-cover object-center" /> */}
                                            <ImgPlaceholder className="aspect-[2/1] rounded-b-none" />
                                        </CardHeader>
                                        <CardContent className="space-y-1.5 2xl:space-y-2.5">
                                            <CardTitle className="2xl:text-xl font-semibold">
                                                {offer.title}
                                            </CardTitle>
                                            <CardDescription className="text-sm 2xl:text-base">
                                                {offer.description}
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            </section>
        </main>
    );
}

const offerList = [
    {
        title: "Orientación profesional",
        description: "Para comprar, vender o resolver tus problemas inmobiliarios.",
    },
    {
        title: "Orientación profesional",
        description: "Con SIBRA, puedes disfrutar de un servicio profesional y personalizado. Conoce nuestros servicios y haz preguntas en nuestro chat.",
    },
    {
        title: "Orientación profesional",
        description: "Con SIBRA, puedes disfrutar de un servicio profesional y personalizado. Conoce nuestros servicios y haz preguntas en nuestro chat.",
    },
]
