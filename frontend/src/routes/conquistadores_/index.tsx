import { PublicLayout } from "@/components/layout/publicLayout";
import { useUIStore } from "@/stores/uiStore";
import { createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect } from "react";
import { SellingPageTemplate } from "@/components/selling-pages/SellingPageTemplate";
import { conquistadoresDefaults } from "@/components/selling-pages/defaults";

export const Route = createFileRoute("/conquistadores_/")({
    component: RouteComponent,
    head: () => ({
        meta: [
            { title: "Conquistadores" },
            {
                name: "description",
                content:
                    "Conoce el desarrollo Conquistadores que SIBRA Inmobiliaria ha hecho en Durango.",
            },
        ],
        links: [
            {
                rel: "stylesheet",
                href: "/conquistadores.css",
            },
            {
                rel: "preload",
                as: "image",
                href: "/conq_video_poster.webp",
            },
        ],
        scripts: [
            {
                src: "/meta-pixel.js",
                async: true,
                defer: true,
                onError: (e) => {
                    console.error(e);
                },
            },
        ],
    }),
});

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplement } = useUIStore();

    useLayoutEffect(() => {
        setHeaderFloating(true);
        setHeaderComplement("none");
    }, []);

    return (
        <PublicLayout>
            <noscript>
                <img
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    src="https://www.facebook.com/tr?id=1585549779476712&ev=PageView&noscript=1"
                />
            </noscript>
            <SellingPageTemplate data={conquistadoresDefaults} />
        </PublicLayout>
    );
}
