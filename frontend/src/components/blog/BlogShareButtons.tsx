import { Check, Copy, Facebook } from "lucide-react";
import { useState } from "react";

// X (Twitter) icon — no lucide equivalent, inline SVG
function XIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

// WhatsApp icon
function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

interface Props {
    url: string;
    title: string;
}

export function BlogShareButtons({ url, title }: Props) {
    const [copied, setCopied] = useState(false);

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback: create a temporary input
            const input = document.createElement("input");
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const btnBase =
        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors";

    return (
        <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-outline-variant/20">
            <span className="text-xs font-semibold text-outline uppercase tracking-wider mr-1">
                Compartir
            </span>

            {/* Copy link */}
            <button
                type="button"
                onClick={handleCopy}
                className={`${btnBase} border border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container`}
                title="Copiar enlace"
            >
                {copied ? (
                    <>
                        <Check className="size-3.5 text-sbr-green-dark" />
                        <span className="text-sbr-green-dark">Copiado</span>
                    </>
                ) : (
                    <>
                        <Copy className="size-3.5" />
                        Copiar enlace
                    </>
                )}
            </button>

            {/* WhatsApp — brand color #25D366 kept intentionally; generic tokens
                would make the button unrecognizable as a platform share action */}
            <a
                href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnBase} bg-[#25D366] text-white hover:bg-[#22c55e]`}
                title="Compartir en WhatsApp"
            >
                <WhatsAppIcon className="size-3.5" />
                WhatsApp
            </a>

            {/* Facebook */}
            <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnBase} bg-[#1877F2] text-white hover:bg-[#1665d8]`}
                title="Compartir en Facebook"
            >
                <Facebook className="size-3.5" />
                Facebook
            </a>

            {/* X / Twitter */}
            <a
                href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnBase} bg-black text-white hover:bg-neutral-800`}
                title="Compartir en X"
            >
                <XIcon className="size-3.5" />X
            </a>
        </div>
    );
}
