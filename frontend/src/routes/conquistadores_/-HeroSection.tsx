export function HeroSection() {
    return (
        <section id="inicio" className="hero relative z-0">
            <div className="absolute inset-0 z-0">
                <video className="h-full w-full object-cover object-center" muted autoPlay loop>
                    <source src="/conquistadores_hero.webm" type="video/mp4" />
                    <source src="/conquistadores_hero.mp4" type="video/mp4" />
                    <source src="/conquistadores_hero.mov" type="video/mov" />
                </video>
                {/* <img */}
                {/*     className="h-full w-full object-cover object-center" */}
                {/*     src="/hero_large.webp" */}
                {/*     alt="" */}
                {/*     data-hero-bgimg */}
                {/*     style={{ filter: "brightness(100%)" }} */}
                {/* /> */}
            </div>
            <div className="relative z-10 bg-sbr-blue-dark/30 pt-40 sm:pt-60 lg:pt-80 opacity-0" data-backdrop>
                {/* <a href="#contacto" className="cta">Agendar mi visita</a> */}
                {/* <p style={{ fontSize: "0.9rem", marginTop: "10px" }}>Desde $875,000 MXN · Escritura inmediata</p> */}
            </div>
            <div className="absolute inset-x-0 -bottom-14 z-20 text-primary-foreground text-end px-5 space-y-1.5" data-content>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-wide opacity-0 translate-y-14" data-inview-animate>Conquistadores</h1>
                <p className="text-xs sm:text-sm lg:text-base text-current/70 opacity-0 translate-y-14" data-inview-animate>Servicios completos · Acceso controlado · Financiamiento directo sin intereses.</p>
            </div>
        </section>
    );
}
