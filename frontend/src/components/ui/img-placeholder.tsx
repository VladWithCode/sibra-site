import { cn } from "@/lib/utils";

export function ImgPlaceholder({ className }: { className?: string }) {
    return <div className={cn("aspect-[3/2] w-full bg-gray-100 rounded-lg", className)}></div>;
}
