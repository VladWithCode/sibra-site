import { ConqsQuoteForm } from "@/components/contact/ConqsQuoteForm";

export function ContactSection() {
    return (
        <section id="contacto" className="relative z-0">
            <div className="absolute inset-0 z-0 bg-[url('/agent_showcase.webp')] bg-cover bg-center bg-fixed bg-no-repeat brightness-90"></div>
            <div className="opacity-0 translate-y-14" data-quote-form>
                <ConqsQuoteForm />
            </div>
        </section>
    );
}

