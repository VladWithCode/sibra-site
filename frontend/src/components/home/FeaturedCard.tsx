import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import { Bath, Bed, MapPin } from "lucide-react";
import { FormatMetric, FormatMoney } from "@/lib/format";
import { Badge } from "../ui/badge";
import { Link } from "@tanstack/react-router";
import {
    featuredImageSrc,
    featuredKindLabel,
    type TResolvedFeaturedItem,
} from "@/queries/featured";

export type TFeaturedCardProps = {
    item: TResolvedFeaturedItem;
    className?: string;
};

/** Generic featured section card. Renders any resolved featured item
 * (property, project, selling page, blog post or external link) with the same
 * look as the original home property cards. */
export function FeaturedCard({ item, className }: TFeaturedCardProps) {
    const isProperty = item.kind === "property" && item.meta;

    const card = (
        <Card className={cn("h-full p-0 rounded-lg overflow-hidden", className)}>
            <CardContent className="relative w-full h-full z-0 p-0">
                <div className="absolute inset-0 z-0">
                    <img
                        src={featuredImageSrc(item.image)}
                        alt={`Imagen de ${item.title}`}
                        className="w-full h-full object-cover brightness-90"
                    />
                </div>
                <div className="absolute top-3 left-3">
                    <Badge className="uppercase rounded-lg font-semibold tracking-wide">
                        {isProperty ? item.meta?.contract : featuredKindLabel(item.kind)}
                    </Badge>
                </div>
                <div className="relative z-10 h-full flex flex-col justify-end bg-gradient-to-t from-foreground/60 to-60% to-foreground/0 text-background p-6">
                    <CardTitle className="text-3xl tracking-wide line-clamp-2">
                        {isProperty ? FormatMoney(item.meta?.price ?? 0) : item.title}
                    </CardTitle>
                    <CardDescription className="text-current tracking-tight mt-1.5 space-y-6">
                        {item.subtitle && (
                            <div className="flex gap-2 items-center font-normal">
                                <MapPin className="size-3.5 shrink-0" />
                                <p className="line-clamp-1 font-medium">{item.subtitle}</p>
                            </div>
                        )}
                        {isProperty && (
                            <ul className="flex gap-4 items-center">
                                {(item.meta?.sqMt ?? 0) > 0 && (
                                    <li className="flex gap-1 items-center">
                                        <span className="font-extrabold">
                                            {FormatMetric(item.meta?.sqMt ?? 0)}
                                            <sup>2</sup>
                                        </span>
                                    </li>
                                )}
                                {(item.meta?.baths ?? 0) > 0 && (
                                    <li className="flex gap-1 items-center">
                                        <span className="font-extrabold">{item.meta?.baths}</span>
                                        <Bath className="size-3.5" />
                                    </li>
                                )}
                                {(item.meta?.beds ?? 0) > 0 && (
                                    <li className="flex gap-1 items-center">
                                        <span className="font-extrabold">{item.meta?.beds}</span>
                                        <Bed className="size-3.5" />
                                    </li>
                                )}
                            </ul>
                        )}
                    </CardDescription>
                </div>
            </CardContent>
        </Card>
    );

    if (item.external) {
        return (
            <a href={item.href} target="_blank" rel="noopener noreferrer">
                {card}
            </a>
        );
    }

    return <Link to={item.href as any}>{card}</Link>;
}
