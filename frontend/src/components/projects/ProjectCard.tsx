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
                <img className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="luxury modern villa architectural rendering with minimalist concrete structure and infinity pool overlooking a valley" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUBxRvbj8T5r_T0I7b8A6zKkSgkijLeHUkXAZS_HzXNiNdHe3SVfZ5-9P0Gkxs0v38p2CJtaW7_Sq3J3Y5ypUmRagjzqWiPptLd9rAKojFVHLUhTYIWA9cjIONxuHFRahiI4KQUyrmca9FcQbov63UI9Az32xgfzZtG9StvLw9p92JrMbCK1_dY_H8crWLJRxzUWNMKwoOQUIqnb4cVWnHjATqIpGXOsMIG0xaJXuEslsPPQXgiZNPjaTJ-8a4uccvig_zMlBRKZU" />
            </CardHeader>
            <CardContent className="space-y-6">
                <CardTitle className="space-y-1.5">
                    {/* <span className="text-sbr-blue font-bold text-xs uppercase tracking-widest block mb-2">Proyecto Insignia</span> */}
                    <h3 className="font-headline text-2xl font-bold text-on-surface tracking-tight">{project.name}</h3>
                    <div className="text-on-surface-variant/80 font-light mt-1 line-clamp-2">
                        {project.description}
                    </div>
                </CardTitle>
                <div className="grid grid-cols-2 gap-6 min-h-20 border-y border-outline-variant/30">
                    <div className="flex flex-col justify-around bg-surface-container p-2 rounded-md">
                        <p className="text-on-surface-variant text-xs uppercase tracking-tighter">Área Total</p>
                        <p className="font-bold md:text-lg">12,450 m²</p>
                    </div>
                    <div className="flex flex-col justify-around bg-surface-container p-2 rounded-md">
                        <p className="text-on-surface-variant text-xs uppercase tracking-tighter">Disponibilidad</p>
                        <p className="font-headline font-bold md:text-lg">14/42 Lotes</p>
                    </div>
                    {/* <div> */}
                    {/*     <p className="text-on-surface-variant text-[10px] uppercase tracking-tighter">Rendimiento Meta</p> */}
                    {/*     <p className="font-headline font-bold md:text-lg text-primary-container">18.4% APY</p> */}
                    {/* </div> */}
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
