import { useUIStore } from "@/stores/uiStore";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_public/politica-de-privacidad")({
    component: RouteComponent,
});

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();
    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplementProps({ complementType: "cta" });
    }, []);

    return (
        <main className="bg-gray-200 max-w-6xl space-y-4 px-6 xl:px-12 py-12 xl:py-24 mx-auto">
            <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>
            <div className="prose max-w-none space-y-8">
                <p className="text-current/80">
                    En cumplimiento con la Ley Federal de Protección de Datos Personales
                    en Posesión de los Particulares (LFPDPPP), SIBRA informa lo siguiente:
                </p>
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold mt-6 mb-4">1. Datos Personales que se Recaban</h2>
                    <p className="text-current/80">Podemos recabar los siguientes datos personales de los usuarios:</p>
                    <ul className="list-disc list-inside pl-2 space-y-3">
                        <li>Nombre completo</li>
                        <li>Correo electrónico</li>
                        <li>Teléfono de contacto</li>
                        <li>Información de identificación oficial (cuando aplique)</li>
                        <li>Datos financieros y patrimoniales estrictamente necesarios para formalizar operaciones</li>
                    </ul>
                    <h2 className="text-2xl font-semibold mt-6 mb-4">2. Finalidad del Uso de los Datos</h2>
                    <p className="text-current/80">Los datos personales recabados serán utilizados para las siguientes finalidades:</p>
                    <ul className="list-disc list-inside pl-2 space-y-3">
                        <li>Brindar información sobre propiedades, promociones y servicios</li>
                        <li>Formalizar procesos de compra, venta o renta de inmuebles</li>
                        <li>Dar cumplimiento a obligaciones legales y contractuales</li>
                        <li>Atender dudas, quejas y aclaraciones</li>
                    </ul>
                    <h2 className="text-2xl font-semibold mt-6 mb-4">3. Uso de Cookies y Tecnologías Similares</h2>
                    <p className="text-current/80">
                        Nuestro sitio utiliza cookies y tecnologías similares para mejorar
                        la experiencia del usuario, analizar tráfico y recordar preferencias.
                    </p>
                    <p className="text-current/80">
                        El usuario puede deshabilitar las cookies desde la configuración de su navegador,
                        aunque esto puede limitar algunas funciones del sitio.
                    </p>
                    <h2 className="text-2xl font-semibold mt-6 mb-4">4. Derechos ARCO</h2>
                    <p className="text-current/80">
                        El titular de los datos personales tiene derecho a:
                    </p>
                    <ul className="list-disc list-inside pl-2 space-y-3">
                        <li><strong>Acceder</strong> a sus datos en posesión de SIBRA</li>
                        <li><strong>Rectificar</strong> datos inexactos o incompletos</li>
                        <li><strong>Cancelar</strong> el uso de sus datos cuando sea posible legalmente</li>
                        <li><strong>Oponerse</strong> al tratamiento de sus datos por motivos legítimos</li>
                    </ul>
                    <p className="text-current/80">
                        Para ejercer estos derechos, el usuario deberá enviar una solicitud al correo
                        sibramx.business@gmail.com, adjuntando copia de identificación oficial.
                    </p>
                    <h2 className="text-2xl font-semibold mt-6 mb-4">5. Medidas de Seguridad Implementadas</h2>
                    <p className="text-current/80">
                        SIBRA adopta medidas administrativas, técnicas y físicas razonables
                        para proteger los datos personales contra pérdida, uso indebido,
                        acceso no autorizado, divulgación o alteración.
                    </p>
                    <h2 className="text-2xl font-semibold mt-6 mb-4">6. Mecanismo de Contacto</h2>
                    <p className="text-current/80">
                        Para cualquier aclaración, duda o ejercicio de derechos relacionados
                        con datos personales, el usuario puede comunicarse al correo sibramx.business@gmail.com
                        o al teléfono +52 618 194 1145.
                    </p>
                </div>
            </div>
        </main>
    );
}
