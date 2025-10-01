import { Heart } from "lucide-react";
import { Button } from "../ui/button";
import type { TProperty } from "@/queries/type";
import { useSavedPropertiesStore } from "@/hooks/useSavedProperties";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

export function LikeButton({ propData }: { propData: TProperty }) {
    const addProperty = useSavedPropertiesStore(store => store.addProperty)
    const removeProperty = useSavedPropertiesStore(store => store.removeProperty)
    const checkLiked = useSavedPropertiesStore(store => store.isLiked)
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
        <Button variant="secondary" size="icon" onClick={handleLike}>
            <Heart className={cn(
                liked ? "text-sbr-green! fill-current" : ""
            )} />
        </Button>
    )
}
