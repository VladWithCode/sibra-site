import { ConqsFooterQuoteForm } from "@/components/contact/ConqsQuoteForm";
import { WhatsappIcon } from "@/components/icons/whatsapp";
import { Clock, MapPin, Phone } from "lucide-react";
import { type SellingPageData } from "./defaults";

type FooterContactProps = {
    data: SellingPageData["footer"];
    pageSlug: string;
    pageName: string;
    whatsappHref: string;
};

export function FooterContact({ data, pageSlug, pageName, whatsappHref }: FooterContactProps) {
    return (
        <footer
            id="contacto-bottom"
            className="sp-reveal bg-slate-950 text-white py-24 md:py-32 px-6"
        >
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16">
                <div className="flex-1 flex flex-col gap-6">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                        Contacto
                    </span>
                    <h2 className="sp-display text-3xl md:text-4xl tracking-tight text-balance">
                        {data.heading || "¿Listo para dar el siguiente paso?"}
                    </h2>
                    {data.tagline && (
                        <p className="text-lg text-stone-300 leading-relaxed max-w-prose">
                            {data.tagline}
                        </p>
                    )}
                    <ul className="flex flex-col gap-4 mt-2">
                        {data.address && (
                            <li className="flex items-center gap-3 text-stone-200">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 ring-1 ring-white/10 shrink-0">
                                    <MapPin className="w-5 h-5 text-emerald-400" />
                                </span>
                                <span>{data.address}</span>
                            </li>
                        )}
                        {data.hours && (
                            <li className="flex items-center gap-3 text-stone-200">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 ring-1 ring-white/10 shrink-0">
                                    <Clock className="w-5 h-5 text-emerald-400" />
                                </span>
                                <span>{data.hours}</span>
                            </li>
                        )}
                        {data.phone && (
                            <li className="flex items-center gap-3 text-stone-200">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 ring-1 ring-white/10 shrink-0">
                                    <Phone className="w-5 h-5 text-emerald-400" />
                                </span>
                                <a
                                    href={data.phoneHref}
                                    className="hover:text-white transition-colors"
                                >
                                    {data.phone}
                                </a>
                            </li>
                        )}
                    </ul>
                    {whatsappHref && (
                        <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 transition-colors text-white font-semibold px-7 py-3.5 w-fit"
                        >
                            <WhatsappIcon className="w-5 h-5" />
                            Escríbenos por WhatsApp
                        </a>
                    )}
                </div>
                <div className="flex-1 flex justify-center lg:justify-end">
                    <div className="w-full max-w-md">
                        <ConqsFooterQuoteForm pageSlug={pageSlug} pageName={pageName} />
                    </div>
                </div>
            </div>
        </footer>
    );
}
