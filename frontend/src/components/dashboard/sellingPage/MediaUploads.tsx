import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { removeSellingPageMediaOpts, uploadSellingPageMediaOpts } from "@/queries/sellingPages";
import type { TSellingPage } from "@/queries/type";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";

type MediaField = {
    field: string;
    label: string;
    accept: string;
};

const MEDIA_FIELDS: MediaField[] = [
    {
        field: "hero_media",
        label: "Hero — Imagen o Video",
        accept: "image/*,video/mp4,video/webm",
    },
    { field: "availability_img", label: "Disponibilidad — Imagen layout" },
    { field: "availability_plan_img", label: "Disponibilidad — Imagen plano (modal)" },
    { field: "contact_bg_img", label: "Contacto — Fondo" },
    { field: "financing_img", label: "Financiamiento — Imagen" },
    { field: "offer_land_img", label: "Oferta — Imagen terreno" },
    { field: "location_img", label: "Ubicación — Imagen" },
].map((m) => ({ accept: "image/*", ...m }));

// Map a media field name to the camelCase API key holding its current value.
const FIELD_TO_KEY: Record<string, keyof TSellingPage> = {
    hero_media: "heroMedia",
    availability_img: "availabilityImg",
    availability_plan_img: "availabilityPlanImg",
    contact_bg_img: "contactBgImg",
    financing_img: "financingImg",
    offer_land_img: "offerLandImg",
    location_img: "locationImg",
};

function MediaRow({ pageId, page, m }: { pageId: string; page: TSellingPage; m: MediaField }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const uploadMut = useMutation(uploadSellingPageMediaOpts(pageId));
    const removeMut = useMutation(removeSellingPageMediaOpts(pageId));

    const current = (page[FIELD_TO_KEY[m.field]] as string) || "";
    const currentUrl = current ? `/static/uploads/${current}` : "";
    const isVideo = m.field === "hero_media" && page.heroMediaType === "video";

    async function onUpload() {
        if (!file) return;
        try {
            await uploadMut.mutateAsync({ id: pageId, field: m.field, file });
            toast.success("Archivo subido", { closeButton: true });
            setFile(null);
            if (inputRef.current) inputRef.current.value = "";
        } catch (e: any) {
            toast.error(e?.message || "Error al subir", { closeButton: true });
        }
    }

    async function onRemove() {
        try {
            await removeMut.mutateAsync(m.field);
            toast.success("Archivo eliminado", { closeButton: true });
        } catch (e: any) {
            toast.error(e?.message || "Error al eliminar", { closeButton: true });
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <div className="w-44 shrink-0">
                <p className="text-sm font-medium">{m.label}</p>
                {current ? (
                    <a
                        href={currentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-xs break-all hover:underline"
                    >
                        {current}
                    </a>
                ) : (
                    <p className="text-muted-foreground text-xs">(usa default)</p>
                )}
            </div>
            {current && !isVideo ? (
                <img
                    src={currentUrl}
                    alt=""
                    className="h-12 w-16 rounded border object-cover"
                />
            ) : null}
            <input
                ref={inputRef}
                type="file"
                accept={m.accept}
                className="flex-1 text-sm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button
                type="button"
                size="sm"
                disabled={!file || uploadMut.isPending}
                onClick={onUpload}
            >
                Subir
            </Button>
            {current ? (
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={removeMut.isPending}
                    onClick={onRemove}
                >
                    Quitar
                </Button>
            ) : null}
        </div>
    );
}

export function MediaUploads({ pageId, page }: { pageId: string; page: TSellingPage }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Multimedia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">
                    Sube archivos para reemplazar los valores por defecto. Imágenes
                    (webp/jpg/png), video (mp4/webm).
                </p>
                {MEDIA_FIELDS.map((m) => (
                    <MediaRow key={m.field} pageId={pageId} page={page} m={m} />
                ))}
            </CardContent>
        </Card>
    );
}
