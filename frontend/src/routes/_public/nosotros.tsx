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
                <div className="relative z-10 bg-linear-to-b from-sbr-blue/60 to-sbr-blue/60 px-6 py-20">
                    <h1 className="text-4xl text-gray-50 font-bold text-center tracking-tighter">
                        "Tu solución inteligente en bienes raíces"
                    </h1>
                </div>
            </section>
            <section className="relative z-0 px-6 py-12 space-y-12">
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold">Nuestra esencia</h2>
                    <p className="text-current/60">
                        En SIBRA creemos que cada propiedad es mucho más que un inmueble: es el
                        inicio de una historia, un legado y una oportunidad de construir
                        confianza. Desde hace más de 26 años, hemos acompañado a miles de
                        familias en Durango a tomar decisiones inteligentes, simpre con cercanía
                        y compromiso real.
                    </p>
                    <div className="w-full aspect-[3/2] bg-gray-200 rounded-lg">
                        <img
                            src="/agent_showcase.png"
                            alt=""
                            className="w-full h-full object-cover object-center rounded-lg"
                        />
                    </div>
                </div>
                <div className="space-y-6">
                    <Card className="bg-sbr-blue pt-0 overflow-hidden">
                        <CardHeader className="p-0">
                            {/* <img src="" alt="" className="w-full h-full object-cover object-center" /> */}
                            <ImgPlaceholder className="aspect-[2/1] rounded-b-none" />
                        </CardHeader>
                        <CardContent className="text-gray-50">
                            <CardTitle className="text-lg font-bold">
                                Asesoría gratuita
                            </CardTitle>
                            <CardDescription className="text-current/80">
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
                        <CardContent className="text-gray-50">
                            <CardTitle className="text-lg font-bold">
                                Transparencia absoluta
                            </CardTitle>
                            <CardDescription className="text-current/80">
                                Procesos claros, contratos en regla, información siempre
                                disponible
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <h3 className="text-lg font-bold">Lo que recibes con SIBRA</h3>
                    <Carousel>
                        <CarouselContent>
                            <CarouselItem className="not-fisrt:pl-6 basis-3/4">
                                <Card className="bg-gray-50 pt-0 overflow-hidden">
                                    <CardHeader className="p-0">
                                        {/* <img src="" alt="" className="w-full h-full object-cover object-center" /> */}
                                        <ImgPlaceholder className="aspect-[2/1] rounded-b-none" />
                                    </CardHeader>
                                    <CardContent className="space-y-1.5">
                                        <CardTitle className="font-semibold">
                                            Orientación profesional
                                        </CardTitle>
                                        <CardDescription className="text-current/80">
                                            Para comprar, vender o resolver tus problemas
                                            inmobiliarios.
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                            <CarouselItem className="not-fisrt:pl-6 basis-3/4">
                                <Card className="bg-gray-50 pt-0 overflow-hidden">
                                    <CardHeader className="p-0">
                                        {/* <img src="" alt="" className="w-full h-full object-cover object-center" /> */}
                                        <ImgPlaceholder className="aspect-[2/1] rounded-b-none" />
                                    </CardHeader>
                                    <CardContent className="space-y-1.5">
                                        <CardTitle className="font-semibold">
                                            Orientación profesional
                                        </CardTitle>
                                        <CardDescription className="text-current/80">
                                            Para comprar, vender o resolver tus problemas
                                            inmobiliarios.
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        </CarouselContent>
                    </Carousel>
                </div>
            </section>
        </main>
    );
}
