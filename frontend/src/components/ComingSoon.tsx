import { cn } from "@/lib/utils";
import { TrafficCone } from "lucide-react";

export function ComingSoon({ className, message }: { message?: string } & React.HTMLAttributes<HTMLDivElement> & React.PropsWithChildren) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center gap-6 py-24 px-6 text-center",
            className,
        )}>
            <TrafficCone className="size-72 text-outline-variant" />
            <h1 className="text-4xl mt-16">Estamos trabajando en ello.</h1>
            <p className="text-lg font-bold text-muted-foreground">
                {message || "Esta página estará disponible pronto"}
            </p>
        </div>
    );
}
