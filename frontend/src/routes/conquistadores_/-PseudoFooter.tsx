import { ConqsFooterQuoteForm } from "@/components/contact/ConqsQuoteForm";
import { Clock, MapPin, Phone } from "lucide-react";

export function PseudoFooter() {
    return (
        <div id="contacto-bottom" className="bg-secondary text-gray-800 px-4 py-16 space-y-6">
            <div className="max-w-2xl space-y-6 mx-auto">
                <h2 className="text-lg sm:text-2xl font-semibold">Agenda tu visita o contáctanos</h2>
                <ul className="grid grid-cols-[auto_auto] gap-2 sm:text-lg">
                    <li className="col-span-full grid grid-cols-subgrid gap-2">
                        <strong className="text-current/80 w-fit flex gap-2">
                            <MapPin className="text-destructive" />
                            <span>Dirección:</span>
                        </strong>
                        <span>C. Cancer #132. Fracc. Sahop, 34190 Durango. Dgo.</span>
                    </li>
                    <li className="col-span-full grid grid-cols-subgrid justify-between gap-2">
                        <strong className="text-current/80 w-fit flex gap-2">
                            <Clock className="text-sbr-blue" />
                            <span>Horario:</span>
                        </strong>
                        <span>Lunes a domingo · 9:00 a.m. – 6:00 p.m.</span>
                    </li>
                    <li className="col-span-full grid grid-cols-subgrid justify-between gap-2">
                        <strong className="text-current/80 w-fit flex gap-2">
                            <Phone className="fill-current" />
                            <span>Tel / WhatsApp:</span>
                        </strong>
                        <a className="underline underline-offset-2 text-sbr-blue" href="tel:6182298042">618 229 8042</a>
                    </li>
                </ul>
            </div>
            <div className="max-w-2xl mx-auto">
                <ConqsFooterQuoteForm />
            </div>
            <p className="text-center lg:text-2xl">
                Terrenos listos. Escritura lista. Solo faltas tú.
            </p>
        </div>
    );
}
