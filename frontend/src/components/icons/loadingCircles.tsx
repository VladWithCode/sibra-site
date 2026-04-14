import { cn } from "@/lib/utils";

export function LoadingCircles({ className }: {} & React.SVGProps<SVGSVGElement>) {
    return (
        <svg className={cn("size-12 stroke-[15]", className)} viewBox='0 0 200 200'>
            <circle fill='currentColor' stroke='currentColor' r='15' cx='40' cy='100'>
                <animate attributeName='opacity' calcMode='spline' dur='2' values='1;0;1;' keySplines='.5 0 .5 1;.5 0 .5 1' repeatCount='indefinite' begin='-.4'>
                </animate>
            </circle>
            <circle fill='currentColor' stroke='currentColor' r='15' cx='100' cy='100'>
                <animate attributeName='opacity' calcMode='spline' dur='2' values='1;0;1;' keySplines='.5 0 .5 1;.5 0 .5 1' repeatCount='indefinite' begin='-.2'>
                </animate>
            </circle>
            <circle fill='currentColor' stroke='currentColor' r='15' cx='160' cy='100'>
                <animate attributeName='opacity' calcMode='spline' dur='2' values='1;0;1;' keySplines='.5 0 .5 1;.5 0 .5 1' repeatCount='indefinite' begin='0'>
                </animate>
            </circle>
        </svg>
    )
}
