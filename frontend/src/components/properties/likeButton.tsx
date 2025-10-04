import { Heart } from "lucide-react";
import { Button } from "../ui/button";
import type { TProject, TProperty } from "@/queries/type";
import { useSavedPropertiesStore } from "@/hooks/useSavedProperties";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

export function LikeButton({ className, propData }: { className?: string, propData: TProperty }) {
    const addProperty = useSavedPropertiesStore(store => store.addProperty)
    const removeProperty = useSavedPropertiesStore(store => store.removeProperty)
    const checkLiked = useSavedPropertiesStore(store => store.checkPropertyLike)
    const [liked, setLiked] = useState(checkLiked(propData.id))
    const handleLike = useCallback(() => {
        setLiked(state => {
            if (state) {
                removeProperty(propData.id);
            } else {
                addProperty(propData.id);
            }
            return !state;
        });
    }, []);


    return (
        <Button
            className={cn("", className)}
            variant="secondary"
            size="icon"
            onClick={handleLike}
        >
            <Heart className={cn(
                "lg:size-5 transition-[color,_fill,_scale] duration-500 stroke-[2.5]",
                liked ? "text-sbr-green! fill-current scale-125" : ""
            )} />
        </Button>
    );
}

export function LikeProjectButton({ className, project }: { className?: string, project: TProject }) {
    const addProject = useSavedPropertiesStore(store => store.addProject)
    const removeProject = useSavedPropertiesStore(store => store.removeProject)
    const checkLiked = useSavedPropertiesStore(store => store.checkProjectLike)
    const [liked, setLiked] = useState(checkLiked(project.slug))
    const handleLike = useCallback(() => {
        setLiked(state => {
            if (state) {
                removeProject(project);
            } else {
                addProject(project);
            }
            return !state;
        });
    }, []);

    return (
        <Button
            className={cn("", className)}
            variant="secondary"
            size="icon"
            onClick={handleLike}
        >
            <Heart className={cn(
                "transition-[color,_fill,_height,_width] duration-500 stroke-[2.5]",
                liked ? "text-sbr-green! fill-current size-5 " : ""
            )} />
        </Button>
    );
}
