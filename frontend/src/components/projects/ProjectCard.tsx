import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { TProject } from "@/queries/type";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectCard({ project, className }: { project: TProject } & React.ComponentProps<"div">) {
    return (
        <Card className={cn(
            "group relative overflow-hidden rounded-xl bg-surface-container-lowest shadow-md pt-0",
            className,
        )}>
            <CardHeader className="p-0">
                <img
                    className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={project.main_img ? `/static/uploads/${project.main_img}` : "/sample.webp"}
                    alt={`Imagen principal del proyecto ${project.name}`}
                />
            </CardHeader>
            <CardContent className="space-y-6">
                <CardTitle className="space-y-1.5">
                    <h3 className="font-headline text-2xl font-bold text-on-surface tracking-tight">{project.name}</h3>
                    <div className="text-on-surface-variant/80 font-light mt-1 line-clamp-2">
                        {project.description}
                    </div>
                </CardTitle>
                <div className="grid grid-cols-2 gap-6 min-h-20 border-y border-outline-variant/30">
                    <div className="flex flex-col justify-around bg-surface-container p-2 rounded-md">
                        <p className="text-on-surface-variant text-xs uppercase tracking-tighter">Área Total</p>
                        <p className="font-bold md:text-lg">
                            {project.total_area > 0 ? `${project.total_area.toLocaleString("es-MX")} m²` : "—"}
                        </p>
                    </div>
                    <div className="flex flex-col justify-around bg-surface-container p-2 rounded-md">
                        <p className="text-on-surface-variant text-xs uppercase tracking-tighter">Disponibilidad</p>
                        <p className="font-headline font-bold md:text-lg">
                            {project.lot_count > 0 ? `${project.available_lots}/${project.lot_count} Lotes` : "—"}
                        </p>
                    </div>
                </div>
                <Button
                    className="flex justify-between items-center gap-2 text-sbr-blue font-bold underline underline-offset-2 hover:scale-103 active:scale-98"
                    variant="link"
                    asChild
                >
                    <Link to={"/proyectos/" + project.slug}>
                        <span>Ver Plan Maestro</span><ArrowRight className="size-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
