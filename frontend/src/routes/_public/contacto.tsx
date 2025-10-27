import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Phone } from "lucide-react";
import { ConnectIcon } from "@/components/icons/connect";
import { InstagramIcon } from "@/components/icons/instagram";
import { FacebookIcon } from "@/components/icons/facebook";
import { useUIStore } from "@/stores/uiStore";
import { useEffect } from "react";

export const Route = createFileRoute("/_public/contacto")({
    component: RouteComponent,
});

function RouteComponent() {
    const { setHeaderComplementProps, setHeaderFloating } = useUIStore();
    useEffect(() => {
        setHeaderFloating(true);
        setHeaderComplementProps({ complementType: "cta" });
    }, []);

    return (
        <main>
            <section className="relative z-0 py-16 sm:py-24 px-6 sm:px-12">
                <div className="absolute z-0 inset-0">
                    <img
                        className="h-full max-w-full xl:w-full object-cover object-center brightness-80"
                        src="/agent_showcase_2.webp"
                        alt=""
                    />
                </div>
                <div className="relative z-10 max-w-2xl text-gray-50 text-center bg-sbr-blue-light/40 backdrop-blur rounded-lg space-y-4 p-6 sm:px-12 sm:py-16 mx-auto">
                    <h1 className="text-4xl sm:text-5xl font-semibold">Contáctanos</h1>
                    <div className="space-y-1">
                        <div className="sm:text-xl space-y-0.5">
                            <p className="">Estamos a tus ordenes.</p>
                            <h3 className="">
                                Servicio al cliente en los horarios:
                            </h3>
                        </div>
                        <div className="sm:w-fit grid grid-cols-[auto_1fr] gap-3 sm:gap-x-12 pt-4 px-8 mx-auto">
                            <div className="col-span-full grid grid-cols-subgrid">
                                <div className="col-start-1 flex flex-col items-center gap-1">
                                    <div className="text-xs sm:text-base font-semibold">Lun-Vie</div>
                                    <Clock className="size-6 sm:size-8" />
                                </div>
                                <div className="col-start-2 xs:text-xl sm:text-2xl font-medium ml-auto mt-auto">
                                    10:00 am - 07:00 pm
                                </div>
                            </div>
                            <div className="col-span-full grid grid-cols-subgrid">
                                <div className="col-start-1 flex flex-col items-center gap-1">
                                    <div className="text-xs sm:text-base font-semibold">Sáb</div>
                                    <Clock className="size-6 sm:size-8" />
                                </div>
                                <div className="col-start-2 xs:text-xl sm:text-2xl font-medium ml-auto mt-auto">
                                    10:00 am - 02:00 pm
                                </div>
                            </div>
                        </div>
                        <h3 className="sm:text-xl text-current/80 mt-6">
                            Llamanos o manda Whatsapp a los números:
                        </h3>
                        <div className="sm:w-fit grid grid-cols-[auto_1fr] gap-3 sm:gap-x-12 pt-4 px-8 mx-auto">
                            <div className="col-span-full grid grid-cols-subgrid">
                                <div className="col-start-1 flex flex-col items-center gap-1">
                                    <div className="text-xs sm:text-base font-semibold">Mazatlán</div>
                                    <Phone className="size-6 sm:size-8" />
                                </div>
                                <div className="col-start-2 xs:text-xl sm:text-2xl ml-4 mr-auto mt-auto">
                                    (669) 112-9742
                                </div>
                            </div>
                            <div className="col-span-full grid grid-cols-subgrid">
                                <div className="col-start-1 flex flex-col items-center gap-1">
                                    <div className="text-xs sm:text-base font-semibold">Durango</div>
                                    <Phone className="size-6 sm:size-8" />
                                </div>
                                <div className="col-start-2 xs:text-xl sm:text-2xl ml-4 mr-auto mt-auto">
                                    (618) 194-1145
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 flex flex-col space-y-3">
                            <Button
                                size="lg"
                                className="sm:text-lg font-semibold sm:py-6 bg-sbr-blue hover:bg-gray-50 active:bg-gray-50 hover:text-sbr-blue active:text-sbr-blue"
                                asChild
                            >
                                <Link to="/agentes">Contactar con un Agente</Link>
                            </Button>
                            <Button
                                size="lg"
                                className="sm:text-lg font-semibold sm:py-6 bg-sbr-green hover:bg-gray-50 active:bg-gray-50 hover:text-sbr-green active:text-sbr-green"
                                asChild
                            >
                                <a href="https://wa.me/6181941145?text=¡Hola! Me gustaría hablar con un agente SIBRA.">
                                    Enviar un Whatsapp
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
            <section className="relative z-0 max-w-6xl px-6 sm:px-12 lg:px-16 py-12 lg:py-24 space-y-6 mx-auto">
                <div className="space-y-1 sm:space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-semibold">Encuentranos</h2>
                    <p className="text-current/60">
                        Puedes encontrar nuestras oficinas en los siguientes domicilios:
                    </p>
                </div>
                <div className="w-full aspect-[3/2] rounded-lg">
                    <Tabs defaultValue="dgo" className="w-full sm:space-y-2">
                        <TabsList className="sm:h-10">
                            <TabsTrigger className="sm:text-base font-normal data-[state=active]:font-medium sm:p-4" value="dgo">Durango</TabsTrigger>
                            <TabsTrigger className="sm:text-base font-normal data-[state=active]:font-medium sm:p-4" value="mzt">Mazatlán</TabsTrigger>
                        </TabsList>
                        <TabsContent value="dgo">
                            <p className="sm:text-lg text-current/80 mb-3">
                                Domicilio: C. Cancer 132. Fracc. Sahop, 34190 Durango, Dgo.
                            </p>
                            <Card className="aspect-[4/3] p-0 rounded-lg overflow-hidden [&>*]:h-full">
                                <CardContent className="h-full p-0">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3644.8457070902837!2d-104.66324402462155!3d24.001224979100773!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x869bc7ffdb768fa5%3A0x2ab21e09ae62252f!2sC%C3%A1ncer%20132%2C%20Sahop%2C%2034190%20Durango%2C%20Dgo.!5e0!3m2!1sen!2smx!4v1757905868906!5m2!1sen!2smx"
                                        width="400"
                                        height="300"
                                        className="w-full h-full object-cover border-0 rounded-lg"
                                        allowFullScreen={false}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    ></iframe>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="mzt">
                            <p className="sm:text-lg text-current/80 mb-3">
                                Domicilio: Av. Ejercito Mexicano 1102B, Sembradores de la
                                Amistad, 82146 Mazatlán, Sin.
                            </p>
                            <Card className="aspect-[4/3] p-0 rounded-lg overflow-hidden [&>*]:h-full">
                                <CardContent className="h-full p-0">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3666.245102084866!2d-106.42603622464132!3d23.234166308398777!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x869f536e84530b25%3A0x35c1072887e44762!2sAv.%20Ej%C3%A9rcito%20Mexicano%201102B%2C%20Sembradores%20de%20la%20Amistad%2C%2082146%20Mazatl%C3%A1n%2C%20Sin.!5e0!3m2!1sen!2smx!4v1757906268437!5m2!1sen!2smx"
                                        width="400"
                                        height="300"
                                        className="w-full h-full object-cover border-0 rounded-lg"
                                        allowFullScreen={false}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    ></iframe>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </section>
            <section className="relative z-0 bg-gray-200 px-6 py-12 sm:py-24 lg:py-32 space-y-6 text-current/80">
                <div className="text-center">
                    <ConnectIcon className="text-current/90 size-10 mx-auto" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-semibold text-center">Conecta con nosotros</h2>
                <div className="flex gap-4 lg:gap-8 items-center justify-center lg:pt-6">
                    <a
                        href="https://www.instagram.com/sibra.durango/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <InstagramIcon className="size-8 lg:size-10" />
                    </a>
                    <a
                        href="https://www.facebook.com/sibra.durango/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <FacebookIcon className="size-8 lg:size-10" />
                    </a>
                </div>
            </section>
        </main>
    );
}
