import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteProfileImageOpts, uploadProfileImageOpts } from "@/queries/auth";
import { useMutation } from "@tanstack/react-query";
import { CloudUpload, ImageIcon, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function useObjectUrl(file: File | undefined | null) {
    const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => {
        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [url]);
    return url;
}

export function ProfileImageSelfCard({ currentImg }: { currentImg: string }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const previewUrl = useObjectUrl(pendingFile);

    const uploadMut = useMutation(uploadProfileImageOpts);
    const deleteMut = useMutation(deleteProfileImageOpts);

    const handleUpload = async () => {
        if (!pendingFile) return;
        try {
            await uploadMut.mutateAsync({ file: pendingFile });
            setPendingFile(null);
            if (inputRef.current) inputRef.current.value = "";
            toast.success("Imagen de perfil actualizada", { closeButton: true });
        } catch (e: any) {
            toast.error(e?.message || "Error al subir la imagen", {
                closeButton: true,
            });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMut.mutateAsync();
            toast.success("Imagen de perfil eliminada", { closeButton: true });
        } catch (e: any) {
            toast.error(e?.message || "Error al eliminar la imagen", {
                closeButton: true,
            });
        }
    };

    const handleCancel = () => {
        setPendingFile(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <ImageIcon className="size-5" />
                    Imagen de perfil
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setPendingFile(f);
                    }}
                />

                {pendingFile && previewUrl ? (
                    <>
                        <div className="relative mx-auto aspect-square w-full max-w-48 overflow-hidden rounded-full border">
                            <img
                                src={previewUrl}
                                alt="Vista previa"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                onClick={handleUpload}
                                disabled={uploadMut.isPending}
                            >
                                <CloudUpload className="size-4" />
                                {uploadMut.isPending ? "Subiendo..." : "Subir"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={uploadMut.isPending}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </>
                ) : currentImg ? (
                    <>
                        <div className="group relative mx-auto aspect-square w-full max-w-48 overflow-hidden rounded-full border">
                            <img
                                src={`/static/uploads/${currentImg}`}
                                alt="Imagen de perfil"
                                className="h-full w-full object-cover"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={handleDelete}
                                disabled={deleteMut.isPending}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => inputRef.current?.click()}
                        >
                            Cambiar imagen
                        </Button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="border-outline-variant/40 hover:border-primary/60 hover:bg-accent/40 flex aspect-square w-full max-w-48 flex-col items-center justify-center gap-2 rounded-full border-2 border-dashed p-6 text-center transition-colors"
                    >
                        <CloudUpload className="text-primary size-8" />
                        <p className="text-sm font-semibold">Subir imagen</p>
                        <p className="text-muted-foreground text-xs">JPEG, PNG o WebP</p>
                    </button>
                )}
            </CardContent>
        </Card>
    );
}
