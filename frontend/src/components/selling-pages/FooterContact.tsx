import { ConqsFooterQuoteForm } from "@/components/contact/ConqsQuoteForm";
import { Clock, MapPin, Phone } from "lucide-react";
import { type SellingPageData } from "./defaults";

type FooterContactProps = {
    data: SellingPageData["footer"];
    pageSlug: string;
    pageName: string;
};

export function FooterContact({ data, pageSlug, pageName }: FooterContactProps) {
    return (
        <div id="contacto-bottom" className="bg-secondary text-gray-800 px-4 py-16 space-y-6">
            <div className="max-w-2xl space-y-6 mx-auto">
                <h2 className="text-lg sm:text-2xl font-semibold">{data.heading}</h2>
                <ul className="grid grid-cols-[auto_auto] gap-2 sm:text-lg">
                    <li className="col-span-full grid grid-cols-subgrid gap-2">
                        <strong className="text-current/80 w-fit flex gap-2">
                            <MapPin className="text-destructive" />
                            <span>Dirección:</span>
                        </strong>
                        <span>{data.address}</span>
                    </li>
                    <li className="col-span-full grid grid-cols-subgrid justify-between gap-2">
                        <strong className="text-current/80 w-fit flex gap-2">
                            <Clock className="text-sbr-blue" />
                            <span>Horario:</span>
                        </strong>
                        <span>{data.hours}</span>
                    </li>
                    <li className="col-span-full grid grid-cols-subgrid justify-between gap-2">
                        <strong className="text-current/80 w-fit flex gap-2">
                            <Phone className="fill-current" />
                            <span>Tel / WhatsApp:</span>
                        </strong>
                        <a
                            className="underline underline-offset-2 text-sbr-blue"
                            href={data.phoneHref}
                        >
                            {data.phone}
                        </a>
                    </li>
                </ul>
            </div>
            <div className="max-w-2xl mx-auto">
                <ConqsFooterQuoteForm pageSlug={pageSlug} pageName={pageName} />
            </div>
            <p className="text-center lg:text-2xl">{data.tagline}</p>
        </div>
    );
}
