import { type SellingPageData } from "./defaults";

type LocationSectionProps = {
    data: SellingPageData["location"];
};

export function LocationSection({ data }: LocationSectionProps) {
    return (
        <section className="relative z-0 px-4 py-16 bg-accent space-y-6">
            <div className="relative z-0 w-full max-w-xl aspect-[2/1] rounded-xs mb-12 sm:mb-16 mx-auto">
                <img
                    src={data.image}
                    alt=""
                    className="w-full h-full object-cover object-center brightness-75 rounded-lg shadow-lg"
                    style={{
                        clipPath: "polygon(0% 0%, 100% 0%, 100% 85%, 0% 97%)",
                    }}
                />
                <div className="absolute -bottom-2 sm:bottom-0 inset-x-0">
                    <h2
                        className="text-5xl sm:text-6xl font-medium tracking-tighter uppercase"
                        style={{ textShadow: "0px 0px 8px rgba(0,0,0,0.65)" }}
                    >
                        {data.heading}
                    </h2>
                </div>
            </div>
            <div className="max-w-xl aspect-[4/3] bg-gray-200 rounded-lg mx-auto">
                <iframe
                    title="Mapa de Ubicación (Google Maps)"
                    className="w-full h-full object-cover border-0 rounded-lg"
                    src={data.mapEmbedUrl}
                    width="400"
                    height="300"
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </div>
            <p className="text-xs sm:text-sm text-gray-800 text-center">{data.caption}</p>
            <div className="flex items-center gap-2.5 lg:gap-4 bg-linear-to-r from-sbr-blue-dark to-sbr-blue-light rounded-xs p-2 sm:p-4 lg:p-6">
                {data.chips.map((chip, index) => (
                    <div key={index} className="contents">
                        {index > 0 && (
                            <div className="basis-0.5 shrink-0 grow-0 h-7 lg:h-9 border-l-2 border-dashed my-auto"></div>
                        )}
                        <div className="basis-1/3 shrink-0 grow-0 sm:p-1">
                            <p className="text-tiny sm:text-sm lg:text-base font-semibold text-current">
                                {chip.text}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
