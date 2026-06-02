import { type Alignment, type SellingPageData, alignText } from "./defaults";

type HeroSectionProps = {
    data: SellingPageData["hero"];
    alignment: Alignment;
};

export function HeroSection({ data, alignment }: HeroSectionProps) {
    return (
        <section id="inicio" className="hero relative z-0">
            <div className="absolute inset-0 z-0">
                {data.videoMp4 || data.videoWebm || data.videoMov ? (
                    <video
                        className="h-full w-full object-cover object-center"
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
                        className="h-full w-full object-cover object-center"
                        src={data.image ?? data.poster}
                        alt=""
                        data-hero-bgimg
                        style={{ filter: "brightness(100%)" }}
                    />
                )}
            </div>
            <div
                className="relative z-10 bg-sbr-blue-dark/30 pt-40 sm:pt-60 lg:pt-80 opacity-0"
                data-backdrop
            ></div>
            <div
                className={`absolute inset-x-0 -bottom-14 z-20 text-primary-foreground px-5 space-y-1.5 ${alignText(alignment)}`}
                data-content
            >
                <h1
                    className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-wide opacity-0 translate-y-14"
                    data-inview-animate
                >
                    {data.title}
                </h1>
                <p
                    className="text-xs sm:text-sm lg:text-base text-current/70 opacity-0 translate-y-14"
                    data-inview-animate
                >
                    {data.subtitle}
                </p>
            </div>
        </section>
    );
}
