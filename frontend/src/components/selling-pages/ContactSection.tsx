import { ConqsQuoteForm } from "@/components/contact/ConqsQuoteForm";
import { type Alignment, type SellingPageData, justifySide } from "./defaults";

type ContactSectionProps = {
    data: SellingPageData["contact"];
    alignment: Alignment;
};

export function ContactSection({ data, alignment }: ContactSectionProps) {
    return (
        <section id="contacto" className="relative z-0">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-fixed bg-no-repeat brightness-90"
                style={{ backgroundImage: `url('${data.bgImage}')` }}
            ></div>
            <div
                className={`relative z-10 flex ${justifySide(alignment)} opacity-0 translate-y-14`}
                data-quote-form
            >
                <ConqsQuoteForm />
            </div>
        </section>
    );
}
