import { describe, expect, it } from "vitest";
import type { TProperty } from "@/queries/type";
import {
    productMetaTags,
    propertyDescription,
    propertyTitle,
    propertyUrl,
    viewContentParams,
} from "./metaCatalog";

const property = (over: Partial<TProperty> = {}): TProperty =>
    ({
        id: "0190-abc",
        title: "Casa con jardín",
        address: "Av. Siempre Viva 1",
        city: "Durango",
        state: "Durango",
        country: "México",
        contract: "venta",
        propertyType: "casa",
        slug: "venta-av-siempre-viva-1",
        status: "publicada",
        price: 1500000,
        shortDescription: "",
        description: "## Amplia\n\nCasa **luminosa** con [jardín](https://example.com).",
        mainImage: {
            id: "img1",
            kind: "image",
            status: "ready",
            width: 1600,
            height: 900,
            hasAudio: false,
            variants: { images: [960, 1600] },
        },
        ...over,
    }) as TProperty;

const origin = "https://sibra.mx";
const toMap = (tags: { property: string; content: string }[]) =>
    Object.fromEntries(tags.map((t) => [t.property, t.content]));

describe("productMetaTags", () => {
    it("emits OpenGraph and product tags with the property id as retailer id", () => {
        expect(toMap(productMetaTags(property(), origin))).toEqual({
            "og:title": "Casa con jardín",
            "og:description": "Amplia Casa luminosa con jardín.",
            "og:url": "https://sibra.mx/propiedades/venta/venta-av-siempre-viva-1",
            "og:image": "https://sibra.mx/static/media/img1/w1600.webp",
            "product:brand": "Sibra Inmobiliaria",
            "product:availability": "in stock",
            "product:condition": "new",
            "product:price:amount": "1500000.00",
            "product:price:currency": "MXN",
            "product:retailer_item_id": "0190-abc",
        });
    });

    it("prefers the short description and falls back to the site logo", () => {
        const tags = toMap(
            productMetaTags(property({ shortDescription: "Corta", mainImage: null }), origin),
        );
        expect(tags["og:description"]).toBe("Corta");
        expect(tags["og:image"]).toBe("https://sibra.mx/static/img/sibra_logo_512.webp");
    });

    it("marks sold properties out of stock", () => {
        const tags = toMap(productMetaTags(property({ status: "vendida" }), origin));
        expect(tags["product:availability"]).toBe("out of stock");
    });

    it("skips product tags without a positive price", () => {
        const tags = productMetaTags(property({ price: 0 }), origin);
        expect(tags.some((t) => t.property.startsWith("product:"))).toBe(false);
        expect(tags).toHaveLength(4);
    });
});

describe("propertyDescription", () => {
    it("matches og:description with and without a short description", () => {
        for (const p of [property(), property({ shortDescription: " Corta " })]) {
            expect(propertyDescription(p)).toBe(
                toMap(productMetaTags(p, origin))["og:description"],
            );
        }
        expect(propertyDescription(property({ shortDescription: " Corta " }))).toBe("Corta");
    });
});

describe("propertyUrl", () => {
    it("matches og:url", () => {
        const p = property();
        expect(propertyUrl(p, origin)).toBe(toMap(productMetaTags(p, origin))["og:url"]);
    });
});

describe("propertyTitle", () => {
    it("generates a title when the property has none", () => {
        expect(propertyTitle(property({ title: " " }))).toBe(
            "Casa en venta en Av. Siempre Viva 1, Durango",
        );
    });
});

describe("viewContentParams", () => {
    it("matches both catalog types with home listing fields", () => {
        expect(viewContentParams(property())).toEqual({
            content_ids: ["0190-abc"],
            content_type: ["home_listing", "product"],
            content_category: "venta",
            value: 1500000,
            currency: "MXN",
            city: "Durango",
            region: "Durango",
            country: "México",
            property_type: "house",
            listing_type: "for_sale_by_agent",
            availability: "for_sale",
        });
    });

    it("maps rentals and land", () => {
        const params = viewContentParams(
            property({ contract: "renta", propertyType: "terreno" }),
        );
        expect(params).toMatchObject({
            property_type: "land",
            listing_type: "for_rent_by_agent",
            availability: "for_rent",
        });
    });
});
