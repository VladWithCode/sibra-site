// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { removeServerHead } from "./serverHead";

describe("removeServerHead", () => {
    beforeEach(() => {
        document.head.innerHTML =
            '<meta name="viewport" content="width=device-width" />' +
            "<title data-server-head>Casa | Sibra Inmobiliaria</title>" +
            '<meta name="description" content="Casa" data-server-head />' +
            '<link rel="canonical" href="https://sibra.mx/propiedades/venta/casa" data-server-head />' +
            '<meta property="product:retailer_item_id" content="0190-abc" data-server-head />' +
            '<meta name="robots" content="noindex" data-server-head />';
    });

    it("removes only the server-injected tags and is idempotent", () => {
        removeServerHead();
        removeServerHead();
        expect(document.head.querySelectorAll("[data-server-head]")).toHaveLength(0);
        expect(document.head.querySelector('meta[name="viewport"]')).not.toBeNull();
    });

    it("restores the default title when the server title was the only one", () => {
        removeServerHead();
        expect(document.title).toBe("Sibra Inmobiliaria");
    });

    it("keeps a title rendered by the page", () => {
        const title = document.createElement("title");
        title.textContent = "Casa con jardín | Sibra Inmobiliaria";
        document.head.prepend(title);
        removeServerHead();
        expect(document.title).toBe("Casa con jardín | Sibra Inmobiliaria");
        expect(document.querySelectorAll("title")).toHaveLength(1);
    });
});
