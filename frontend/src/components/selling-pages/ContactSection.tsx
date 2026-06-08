import { ConqsQuoteForm } from "@/components/contact/ConqsQuoteForm";
import { type Alignment, type SellingPageData, justifySide } from "./defaults";

type ContactSectionProps = {
    data: SellingPageData["contact"];
    alignment: Alignment;
    pageSlug: string;
    pageName: string;
};

export function ContactSection({ data, alignment, pageSlug, pageName }: ContactSectionProps) {
    return (
        <section id="contacto" className="sp-reveal relative z-0 py-24 md:py-32 px-6">
            <div className="absolute inset-0 -z-10">
                <img
                    src={data.bgImage}
                    alt=""
                    className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 to-slate-900/65" />
            </div>
            <div className={`max-w-6xl mx-auto flex ${justifySide(alignment)}`}>
                <div className="w-full max-w-md">
                    <ConqsQuoteForm pageSlug={pageSlug} pageName={pageName} variant="onDark" />
                </div>
            </div>
        </section>
    );
}
