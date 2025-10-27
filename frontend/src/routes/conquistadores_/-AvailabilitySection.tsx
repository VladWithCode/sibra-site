import { Button } from "@/components/ui/button";

export function AvailablitySection() {
    return (
        <section id="disponibilidad" className="pt-36 pb-20 px-4 lg:px-12 space-y-6">
            {/* <h2 className="text-2xl font-bold text-current/80">Disponibilidad</h2> */}
            <div
                className="relative z-0"
            >
                <img
                    src="/disp1.webp"
                    alt="Imagen del plano de disponibilidad del desarrollo Conquistadores II"
                    className="h-full w-full object-cover object-center rounded shadow-lg opacity-0"
                    data-avl-img
                />
                <div
                    className=" translate-y-14 opacity-0"
                    data-avl-content
                >
                    <Button
                        className="absolute -bottom-3 right-4 px-8 sm:py-5 text-lg sm:text-xl text-primary-foreground font-medium bg-linear-to-b from-sbr-green-light to-sbr-green rounded shadow-lg"
                        size="sm"
                    >
                        Ver Plano
                    </Button>
                </div>
            </div>
        </section>
    );
}

