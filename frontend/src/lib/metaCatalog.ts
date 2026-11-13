/**
 * Meta catalog mappings for the property detail page: the OpenGraph product
 * tags the pixel reads from the DOM, and the ViewContent parameters. They
 * mirror the server's tags and home listing feed (internal/routes/property_seo.go,
 * internal/routes/property_feed.go): the catalog item id is the property id.
 */
import { isReady, stillSrc } from "@/lib/media";
import type { TProperty } from "@/queries/type";

const OG_FALLBACK_IMAGE = "/static/img/sibra_logo_512.webp";

/** Property title, or "Casa en venta en Av. 1, Durango" when it has none. */
export function propertyTitle(p: TProperty): string {
    const title = p.title?.trim();
    if (title) return title;
    const kind = p.propertyType || "propiedad";
    let out = kind[0].toUpperCase() + kind.slice(1);
    if (p.contract) out += ` en ${p.contract}`;
    const place = [p.address?.trim(), p.city?.trim()].filter(Boolean).join(", ");
    if (place) out += ` en ${place}`;
    return out;
}

/** Rough Markdown to single-line plain text, for meta descriptions. */
function markdownToPlainText(md: string): string {
    return md
        .replace(/<[^>]*>/g, " ")
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/^\s*(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
        .replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, "")
        .replace(/[*_`~|]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/** Cuts `s` to `max` characters at a word break and appends an ellipsis. */
function truncate(s: string, max: number): string {
    const chars = Array.from(s);
    if (chars.length <= max) return s;
    let cut = chars.slice(0, max).join("");
    const space = cut.lastIndexOf(" ");
    if (space > 0) cut = cut.slice(0, space);
    return `${cut}…`;
}

/** Short description, or the start of the description as plain text. */
export function propertyDescription(p: TProperty): string {
    return (
        p.shortDescription?.trim() || truncate(markdownToPlainText(p.description ?? ""), 155)
    );
}

/** Plain number with two decimals ("1500000.00"), or null without a price. */
export function catalogPrice(price: number): string | null {
    return Number.isFinite(price) && price > 0 ? price.toFixed(2) : null;
}

export function propertyUrl(p: TProperty, origin: string): string {
    return `${origin}/propiedades/${encodeURIComponent(p.contract)}/${encodeURIComponent(p.slug)}`;
}

export function homeListingAvailability(p: TProperty) {
    return p.contract === "renta" ? "for_rent" : "for_sale";
}

export function homeListingType(p: TProperty) {
    return p.contract === "renta" ? "for_rent_by_agent" : "for_sale_by_agent";
}

export function homePropertyType(p: TProperty) {
    switch (p.propertyType) {
        case "casa":
            return "house";
        case "apartamento":
            return "apartment";
        case "terreno":
            return "land";
        default:
            return "other";
    }
}

/** OpenGraph tags plus Meta's product microdata tags for the property page. */
export function productMetaTags(
    p: TProperty,
    origin: string,
): { property: string; content: string }[] {
    const image = isReady(p.mainImage) ? stillSrc(p.mainImage, 1200) : "";
    const tags = [
        { property: "og:title", content: propertyTitle(p) },
        { property: "og:description", content: propertyDescription(p) },
        { property: "og:url", content: propertyUrl(p, origin) },
        { property: "og:image", content: origin + (image || OG_FALLBACK_IMAGE) },
    ];
    const price = catalogPrice(p.price);
    if (price === null) return tags;
    return [
        ...tags,
        { property: "product:brand", content: "Sibra Inmobiliaria" },
        {
            property: "product:availability",
            content: p.status === "vendida" ? "out of stock" : "in stock",
        },
        { property: "product:condition", content: "new" },
        { property: "product:price:amount", content: price },
        { property: "product:price:currency", content: "MXN" },
        { property: "product:retailer_item_id", content: p.id },
    ];
}

/** ViewContent parameters matching both the product and home listing catalogs. */
export function viewContentParams(p: TProperty): Record<string, unknown> {
    return {
        content_ids: [p.id],
        content_type: ["home_listing", "product"],
        content_category: p.contract,
        value: p.price,
        currency: "MXN",
        city: p.city,
        region: p.state,
        country: p.country,
        property_type: homePropertyType(p),
        listing_type: homeListingType(p),
        availability: homeListingAvailability(p),
    };
}
