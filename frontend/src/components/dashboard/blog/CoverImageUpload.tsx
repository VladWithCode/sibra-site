import { uploadBlogImageOpts } from "@/queries/blog";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Loader2, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB — matches backend
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Props {
    value: string;
    onChange: (url: string) => void;
}

/** Resolves a stored cover_image value to a displayable <img src>. */
function previewSrc(value: string): string {
    if (!value) return "";
    if (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://")) {
        return value;
    }
    return `/static/uploads/${value}`;
}

/**
 * CoverImageUpload replaces the cover_image text input in the blog post form.
 * It uploads via POST /api/admin/blog/uploads and sets the returned URL on the
 * form field. Clearing does NOT delete the physical file (by design).
 */
export function CoverImageUpload({ value, onChange }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [clientError, setClientError] = useState<string | null>(null);

    const mut = useMutation(uploadBlogImageOpts());

    const handleFile = (file: File) => {
        setClientError(null);
        if (!ALLOWED_TYPES.includes(file.type)) {
            setClientError("Solo se permiten imágenes JPEG, PNG o WebP.");
            return;
        }
        if (file.size > MAX_SIZE_BYTES) {
            setClientError("La imagen no puede superar 8MB.");
            return;
        }
        mut.mutate(
            { file },
            {
                onSuccess: (data) => {
                    onChange(data.url);
                    if (inputRef.current) inputRef.current.value = "";
                },
                onError: (err: Error) => {
                    setClientError(err.message || "Error al subir la imagen.");
                    if (inputRef.current) inputRef.current.value = "";
                },
            },
        );
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const handleClear = () => {
        onChange("");
        setClientError(null);
        mut.reset();
        if (inputRef.current) inputRef.current.value = "";
    };

    const displayError = clientError ?? (mut.isError ? (mut.error as Error).message : null);
    const src = previewSrc(value);

    if (src) {
        return (
            <div className="space-y-2">
                <div className="relative group rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container">
                    <img
                        src={src}
                        alt="Imagen de portada"
                        className="w-full object-cover max-h-52"
                    />
                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label
                            className={`inline-flex items-center gap-1.5 rounded-md bg-white/90 px-3 py-1.5 text-xs font-semibold text-on-surface transition-colors ${
                                mut.isPending ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-white"
                            }`}
                        >
                            {mut.isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Upload className="size-3.5" />
                            )}
                            {mut.isPending ? "Subiendo…" : "Cambiar imagen"}
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                disabled={mut.isPending}
                                onChange={onInputChange}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={mut.isPending}
                            className="inline-flex items-center gap-1.5 rounded-md bg-destructive/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive transition-colors disabled:opacity-50"
                        >
                            <Trash2 className="size-3.5" />
                            Eliminar
                        </button>
                    </div>
                </div>
                {displayError && (
                    <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <X className="size-3 shrink-0" />
                        {displayError}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed min-h-[140px] px-4 py-6 text-sm transition-colors ${
                    mut.isPending
                        ? "border-outline-variant/40 text-on-surface-variant/50 cursor-not-allowed"
                        : "border-outline-variant/50 text-on-surface-variant hover:border-sbr-blue/50 hover:bg-surface-container/40 cursor-pointer"
                }`}
            >
                {mut.isPending ? (
                    <>
                        <Loader2 className="size-6 animate-spin text-on-surface-variant" />
                        <span>Subiendo imagen…</span>
                    </>
                ) : (
                    <>
                        <ImagePlus className="size-6 text-on-surface-variant/60" />
                        <span className="text-center font-medium">Subir imagen de portada</span>
                        <span className="text-xs text-on-surface-variant/60">
                            JPEG, PNG o WebP · máx. 8MB · clic o arrastra aquí
                        </span>
                    </>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={mut.isPending}
                    onChange={onInputChange}
                />
            </label>
            {displayError && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <X className="size-3 shrink-0" />
                    {displayError}
                </p>
            )}
        </div>
    );
}
