import { type Alignment, type SellingPageData } from "./defaults";

type HeroSectionProps = {
    data: SellingPageData["hero"];
    alignment: Alignment;
};

function alignClasses(alignment: Alignment) {
    switch (alignment) {
        case "left":
            return { justify: "justify-start", items: "items-start", text: "text-left" };
        case "center":
            return { justify: "justify-center", items: "items-center", text: "text-center" };
        default:
            return { justify: "justify-end", items: "items-end", text: "text-right" };
    }
}

export function HeroSection({ data, alignment }: HeroSectionProps) {
    const cls = alignClasses(alignment);
    const centered = alignment === "center";

    return (
        <section
            id="inicio"
            className="sp-reveal relative z-0 min-h-[80vh] md:min-h-[92vh] flex overflow-hidden"
        >
            <div className="absolute inset-0 -z-10">
                {data.videoMp4 || data.videoWebm || data.videoMov ? (
                    <video
                        className="w-full h-full object-cover object-center"
                        muted
                        autoPlay
                        loop
                        preload="metadata"
                        playsInline
                        poster={data.poster}
                    >
                        {data.videoWebm && <source src={data.videoWebm} type="video/webm" />}
                        {data.videoMp4 && <source src={data.videoMp4} type="video/mp4" />}
                        {data.videoMov && <source src={data.videoMov} type="video/mov" />}
                    </video>
                ) : (
                    <img
                        className="w-full h-full object-cover object-center"
                        src={data.image ?? data.poster}
                        alt=""
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-slate-950/20" />
            </div>

            <div
                className={`relative w-full max-w-6xl mx-auto px-6 py-28 flex flex-col ${cls.justify} ${cls.items}`}
            >
                <div
                    className={`max-w-xl flex flex-col gap-6 ${cls.text} ${centered ? "items-center" : "items-start"}`}
                >
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
                        <span className="h-px w-6 bg-emerald-300/70" />
                        Desarrollo residencial
                    </span>
                    <h1
                        className="sp-display text-5xl sm:text-6xl lg:text-7xl tracking-tight text-white text-balance"
                        style={{ textShadow: "0 2px 24px rgba(0,0,0,.35)" }}
                    >
                        {data.title}
                    </h1>
                    <p className="text-lg sm:text-xl text-stone-100/85 leading-relaxed max-w-prose">
                        {data.subtitle}
                    </p>
                    <a
                        href="#contacto"
                        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 transition-colors text-white font-semibold text-base px-8 py-3.5 shadow-lg shadow-emerald-900/20"
                    >
                        Agenda tu visita
                    </a>
                </div>
            </div>

            <a
                href="#disponibilidad"
                aria-label="Desplazar"
                className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition-colors"
            >
                <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6 fill-current animate-bounce"
                    aria-hidden
                >
                    <path d="M12 16.5a1 1 0 0 1-.7-.29l-6-6a1 1 0 1 1 1.4-1.42L12 14.09l5.3-5.3a1 1 0 0 1 1.4 1.42l-6 6a1 1 0 0 1-.7.29z" />
                </svg>
            </a>
        </section>
    );
}
