import { Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle } from "lucide-react";

export function BlogCta() {
    return (
        <aside className="my-8 rounded-2xl border border-sbr-blue/20 bg-gradient-to-br from-sbr-blue-dark to-sbr-blue p-6 md:p-8 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-widest">
                        <MessageCircle className="size-3.5" />
                        Sibra Inmobiliaria
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold leading-snug">
                        ¿Te interesa comprar, vender o invertir?
                    </h3>
                    <p className="text-white/75 text-sm leading-relaxed">
                        Agenda una asesoría con Sibra y encuentra la propiedad ideal para ti.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-col gap-2 shrink-0">
                    <Link
                        to="/contacto"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-sbr-blue px-5 py-2.5 text-sm font-bold hover:bg-white/90 transition-colors"
                    >
                        Contactar
                        <ArrowRight className="size-4" />
                    </Link>
                    <Link
                        to="/propiedades"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 text-white px-5 py-2.5 text-sm font-semibold hover:bg-white/10 transition-colors"
                    >
                        Ver propiedades
                    </Link>
                </div>
            </div>
        </aside>
    );
}
