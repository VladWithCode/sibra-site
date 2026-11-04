import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stillSrc, type TMediaAsset } from "@/lib/media";
import { MEDIA_ACCEPT, checkMediaFile, uploadWithProgress } from "@/queries/mediaUpload";
import { queryClient } from "@/queries/queryClient";
import {
    SellingPageQueryKeys,
    removeSellingPageMediaOpts,
    uploadSellingPageMediaOpts,
} from "@/queries/sellingPages";
import type { TSellingPage } from "@/queries/type";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type MediaField = {
    field: string;
    label: string;
    accept: string;
};

const MEDIA_FIELDS: MediaField[] = [
    { field: "availability_img", label: "Disponibilidad — Imagen layout" },
    { field: "availability_plan_img", label: "Disponibilidad — Imagen plano (modal)" },
    { field: "contact_bg_img", label: "Contacto — Fondo" },
    { field: "financing_img", label: "Financiamiento — Imagen" },
    { field: "offer_land_img", label: "Oferta — Imagen terreno" },
    { field: "location_img", label: "Ubicación — Imagen" },
].map((m) => ({ accept: "image/*", ...m }));

// Map a media field name to the camelCase API key holding its current value.
const FIELD_TO_KEY: Record<string, keyof TSellingPage> = {
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
            {current ? (
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

function AssetThumb({ asset }: { asset: TMediaAsset }) {
    if (asset.status === "ready") {
        return (
            <img
                src={stillSrc(asset, 480)}
                alt=""
                className="h-12 w-16 rounded border object-cover"
            />
        );
    }
    if (asset.status === "failed") {
        return (
            <span className="text-destructive flex items-center gap-1 text-xs">
                <AlertCircle className="size-4" />
                {asset.error || "Error al procesar"}
            </span>
        );
    }
    return (
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Loader2 className="size-4 animate-spin" />
            Procesando{asset.kind === "video" ? " video" : ""}…
        </span>
    );
}

/**
 * Hero image or video. Uploads stream with progress and encode on the
 * server; the current hero stays live until the new one is ready.
 */
function HeroMediaRow({ pageId, page }: { pageId: string; page: TSellingPage }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState<number | null>(null);
    const removeMut = useMutation(removeSellingPageMediaOpts(pageId));
    const current = page.heroAsset;
    const pending = page.heroPendingAsset;
    const legacy = !current && page.heroMedia ? page.heroMedia : "";

    async function onUpload() {
        if (!file) return;
        const problem = await checkMediaFile(file, true);
        if (problem) {
            toast.error(problem, { closeButton: true });
            return;
        }
        setProgress(0);
        try {
            await uploadWithProgress(
                `/api/terrenos/${pageId}/medios/hero_media`,
                "file",
                file,
                setProgress,
                "PUT",
            );
            toast.success("Archivo subido; se publicará cuando termine de procesarse", {
                closeButton: true,
            });
            setFile(null);
            if (inputRef.current) inputRef.current.value = "";
        } catch (e: any) {
            toast.error(e?.message || "Error al subir", { closeButton: true });
        } finally {
            setProgress(null);
            queryClient.invalidateQueries({ queryKey: SellingPageQueryKeys.byId(pageId) });
        }
    }

    async function onRemove() {
        try {
            await removeMut.mutateAsync("hero_media");
            toast.success("Archivo eliminado", { closeButton: true });
        } catch (e: any) {
            toast.error(e?.message || "Error al eliminar", { closeButton: true });
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            <div className="w-44 shrink-0">
                <p className="text-sm font-medium">Hero — Imagen o Video</p>
                <p className="text-muted-foreground text-xs">
                    {current
                        ? current.kind === "video"
                            ? "Video"
                            : "Imagen"
                        : legacy || "(usa default)"}
                </p>
            </div>
            {current ? <AssetThumb asset={current} /> : null}
            {pending ? (
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Reemplazo:</span>
                    <AssetThumb asset={pending} />
                </div>
            ) : null}
            <input
                ref={inputRef}
                type="file"
                accept={MEDIA_ACCEPT}
                className="flex-1 text-sm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button
                type="button"
                size="sm"
                disabled={!file || progress !== null}
                onClick={onUpload}
            >
                {progress !== null ? `Subiendo ${Math.round(progress * 100)}%` : "Subir"}
            </Button>
            {current || pending || legacy ? (
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
                    (webp/jpg/png). El hero acepta también video MP4, MOV o WebM (máx 500MB y 3
                    minutos); se optimiza en el servidor antes de publicarse.
                </p>
                <HeroMediaRow pageId={pageId} page={page} />
                {MEDIA_FIELDS.map((m) => (
                    <MediaRow key={m.field} pageId={pageId} page={page} m={m} />
                ))}
            </CardContent>
        </Card>
    );
}
