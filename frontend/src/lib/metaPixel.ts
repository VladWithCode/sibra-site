// Meta Pixel for the public site. The pixel script loads lazily on the first
// tracked event, so the panel never loads it.
const PIXEL_ID = "441188577077416";

function ensurePixel(): NonNullable<Window["fbq"]> {
    if (window.fbq) return window.fbq;

    // Standard Meta bootstrap: queue calls until fbevents.js finishes loading.
    const fbq: any = function (...args: unknown[]) {
        fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    // The router reports every navigation itself (usePageTracking); without this
    // the pixel would also fire its own PageView on history changes.
    fbq.disablePushState = true;
    // Without this the pixel drops every PageView after the first one.
    fbq.allowDuplicatePageViews = true;
    window.fbq = fbq;
    (window as any)._fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    fbq("init", PIXEL_ID);
    return fbq;
}

/**
 * Sends a standard Meta Pixel event. Pass `eventID` when the backend reports
 * the same event through the Conversions API, so Meta counts it once.
 */
export function trackPixel(
    event: string,
    params: Record<string, unknown> = {},
    eventID?: string,
) {
    try {
        ensurePixel()("track", event, params, eventID ? { eventID } : undefined);
    } catch (err) {
        console.error("meta pixel:", err);
    }
}

/** Fires `Contact` when a visitor clicks a WhatsApp chat or phone link. */
export function trackContactClick(evt: MouseEvent) {
    const link = (evt.target as Element | null)?.closest?.("a[href]");
    const href = link?.getAttribute("href") ?? "";
    // `wa.me/?text=` (no number) is the blog share button, not a contact.
    if (href.startsWith("tel:")) trackPixel("Contact", { method: "phone" });
    else if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\/[^?]/.test(href))
        trackPixel("Contact", { method: "whatsapp" });
}
