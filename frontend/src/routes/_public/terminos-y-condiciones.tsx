import { useUIStore } from "@/stores/uiStore";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_public/terminos-y-condiciones")({
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
            <h1 className="text-3xl font-bold mb-6">Términos y Condiciones de Uso</h1>
            <div className="prose max-w-none space-y-8 ">
                <p className="text-current/80">Estos términos de servicio rigen el uso de nuestros servicios inmobiliarios.</p>
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold">1. Identificación de la empresa</h2>
                    <p className="text-current/80">
                        El presente sitio web es operado por <strong>consorcio SIBRA</strong> (en adelante, “SIBRA”),
                        con domicilio en Cáncer 132, Sahop, 34190 Durango, Dgo,
                        correo electrónico de contacto sibramx.business@gmail.com
                        y teléfono +52 618 194 1145.
                    </p>
                    <h2 className="text-2xl font-semibold">2. Objeto y Alcance de los Servicios</h2>
                    <p className="text-current/80 mb-3">
                        A través de este sitio web, SIBRA pone a disposición de los usuarios información
                        y servicios relacionados con bienes raíces, incluyendo la promoción,
                        venta y renta de propiedades.
                    </p>
                    <p className="text-current/80">
                        El acceso y uso del sitio implica la aceptación
                        plena de los presentes Términos y Condiciones.
                    </p>
                    <h2 className="text-2xl font-semibold">3. Uso Permitido y Restricciones</h2>
                    <ul className="list-disc list-inside pl-2 space-y-3">
                        <li>
                            El usuario se compromete a hacer uso del sitio de manera lícita,
                            sin contravenir las disposiciones legales aplicables en México.
                        </li>
                        <li>
                            Queda prohibido modificar, copiar, distribuir, transmitir, publicar, reproducir,
                            crear obras derivadas o comercializar cualquier contenido
                            del sitio sin autorización expresa de SIBRA.
                        </li>
                        <li>
                            El uso indebido del sitio podrá dar lugar a acciones legales.
                        </li>
                    </ul>
                    <h2 className="text-2xl font-semibold">4. Limitación de Responsabilidad y Garantías</h2>
                    <ul className="list-disc list-inside pl-2 space-y-3">
                        <li>
                            SIBRA no garantiza que los servicios estén libres de interrupciones,
                            errores técnicos o fallas de seguridad,
                            aunque implementa medidas para minimizar dichos riesgos.
                        </li>
                        <li>
                            La información publicada sobre propiedades es meramente informativa
                            y puede variar sin previo aviso.
                        </li>
                        <li>
                            SIBRA no será responsable de daños directos o indirectos derivados
                            del uso del sitio o de la información contenida en él.
                        </li>
                    </ul>
                    <h2 className="text-2xl font-semibold">5. Propiedad Intelectual</h2>
                    <p className="text-current/80 mb-3">
                        Todo el contenido de este sitio, incluyendo logotipos, textos, imágenes,
                        videos, bases de datos, software y diseños, es propiedad de SIBRA
                        y se encuentra protegido por las leyes mexicanas de derechos de autor
                        y propiedad industrial.
                    </p>
                    <p className="text-current/80">
                        Queda prohibida su reproducción total o parcial sin autorización expresa.
                    </p>
                    <h2 className="text-2xl font-semibold">6. Jurisdicción y Leyes Aplicables</h2>
                    <p className="text-current/80 mb-3">
                        Estos Términos y Condiciones se regirán e interpretarán conforme a las
                        leyes vigentes en los Estados Unidos Mexicanos.
                    </p>
                    <p className="text-current/80">
                        En caso de controversia, las partes se someten a la jurisdicción
                        de los tribunales competentes de Victoria de Durango, Durango Mex.
                    </p>
                </div>
            </div>
        </main>
    );
}
