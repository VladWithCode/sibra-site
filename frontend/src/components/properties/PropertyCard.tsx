import type { TProperty } from "@/properties";
import { Card, CardHeader } from "../ui/card";

export function PropertyCard({ property }: { property: TProperty }) {
    return (
        <Card className="">
            <CardHeader className="p-0">
                <img src={property.mainImg} className="w-full h-full object-cover rounded-t-lg" />
            </CardHeader>
        </Card>
    );
}
