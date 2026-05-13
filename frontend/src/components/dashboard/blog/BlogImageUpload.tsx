import { uploadBlogImageOpts } from "@/queries/blog";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB — matches backend
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Props {
    onInsert: (markdown: string) => void;
}

export function BlogImageUpload({ onInsert }: Props) {
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
                    onInsert(data.markdown);
                    // reset so the same file can be re-uploaded if needed
                    if (inputRef.current) inputRef.current.value = "";
                },
                onError: () => {
                    if (inputRef.current) inputRef.current.value = "";
                },
            },
        );
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const error = clientError ?? (mut.isError ? (mut.error as Error).message : null);

    return (
        <div className="space-y-1.5">
            <label
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`flex items-center gap-2 w-full cursor-pointer rounded-md border border-dashed px-3 py-2 text-sm transition-colors
                    ${mut.isPending
                        ? "border-outline-variant/40 text-outline cursor-not-allowed"
                        : "border-outline-variant/50 text-outline hover:border-sbr-blue/50 hover:text-on-surface hover:bg-surface-container/50"
                    }`}
            >
                {mut.isPending ? (
                    <>
                        <Loader2 className="size-4 shrink-0 animate-spin" />
                        <span>Subiendo imagen…</span>
                    </>
                ) : (
                    <>
                        <ImagePlus className="size-4 shrink-0" />
                        <span>Subir imagen (JPEG, PNG, WebP · máx. 8MB) — clic o arrastra aquí</span>
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

            {mut.isSuccess && !error && (
                <p className="flex items-center gap-1 text-xs text-green-600">
                    Imagen insertada en el editor.
                </p>
            )}

            {error && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <X className="size-3 shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
}
