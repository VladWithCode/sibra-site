import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { LikeProjectButton } from "../properties/likeButton";
import type { TProject } from "@/queries/type";
import { ShareIcon } from "../icons/icons";
import { Link } from "@tanstack/react-router";

export function ProjectCard({ project }: { project: TProject, withMap?: boolean }) {
    return (
        <Card className="py-0 gap-3">
            <CardHeader className="p-0 bg-gray-100 gap-0">
                <Link to={`/proyectos/${project.slug}`}>
                    <img src="/hero.png" alt="" className="w-full aspect-[5/2] object-cover object-center brightness-80 rounded-t-lg" />
                </Link>
            </CardHeader>
            <CardContent className="pt-0 pb-3 px-3 sm:px-3.5 space-y-3">
                <div className="grid grid-cols-[1fr_auto] auto-rows-min items-start gap-3">
                    <Link to={`/proyectos/${project.slug}`} className="mt-auto">
                        <p className="text-sm text-muted-foreground">
                            Desarrollo SIBRA
                        </p>
                        <h3 className="text-lg xs:text-2xl font-bold line-clamp-1">
                            {project.name}
                        </h3>
                    </Link>
                    <div className="space-y-1">
                        <div className="flex gap-2 items-center justify-between">
                            <Button className="shadow" variant="secondary" size="icon">
                                <ShareIcon className="size-5" />
                            </Button>
                            <LikeProjectButton className="shadow" project={project} />
                        </div>
                        <Button asChild variant="default" size="sm">
                            <Link to={`/proyectos/${project.slug}`} className="w-full bg-sbr-blue text-gray-50 font-semibold">
                                Conocer
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
