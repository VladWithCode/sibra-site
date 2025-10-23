import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Phone } from "lucide-react";

export function StepsSection() {
    return (
        <section id="pasos" className="relative z-0 bg-card px-8 py-16 sm:py-24 space-y-12">
            <div className="mx-auto h-1 w-20 bg-sbr-blue-light rounded-full -mt-12"></div>
            <ol className="space-y-6">
                {
                    BuyingSteps.map((stepData, index) => (
                        <li key={index}>
                            <BuyStepCard stepData={stepData} />
                        </li>
                    ))
                }
            </ol>
        </section>
    );
}

const BuyingSteps = [
    {
        step: 1,
        title: "Agenda Cita",
        description: ["Contactanos para conocer el desarrollo."],
        icon: <Phone className="size-8" />,
    },
    {
        step: 2,
        title: "Aparta tu lote",
        description: [
            "Aprovecha esta gran oferta...",
            "¡Ultimos 11 lotes disponibles!",
        ],
        icon: MapPin,
    },
    {
        step: 3,
        title: "Entrega del terreno",
        description: ["Recibe tu terreno contra-anticipo."],
        icon: Phone,
    },
    {
        step: 4,
        title: "Construye",
        description: ["Junto a tus seres queridos da un paso a su patrimonio seguro."],
        icon: Clock,
    },
] as const;

function BuyStepCard({ stepData }: { stepData: typeof BuyingSteps[number] }) {
    return (
        <Card
            className="max-w-lg bg-sbr-green-dark -translate-x-14 opacity-0 mx-auto"
            style={{
                boxShadow: "0px 10px 1px -2px var(--color-sbr-green-light)",
            }}
            data-card-wrapper
        >
            <CardContent className="flex gap-4 sm:gap-6 text-primary-foreground px-5 sm:px-8">
                <p className="text-5xl sm:text-6xl text-current/90 font-bold my-auto">{stepData.step}</p>
                <div className="space-y-1.5 sm:space-y-2">
                    <h3 className="text-lg sm:text-2xl font-bold">{stepData.title}</h3>
                    <div className="space-y-0.5 sm:text-lg">
                        {stepData.description.map((description, index) => (
                            <p key={index} className="text-current/70">
                                {description}
                            </p>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
