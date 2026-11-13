/**
 * Tags the Go server injects into <head> for crawlers and link previews
 * (internal/routes/blog_seo.go, internal/routes/property_seo.go) carry
 * `data-server-head`. React does not manage them, so they are removed once
 * they stop describing the current page, or when the page renders its own
 * equivalent set through its route `head`.
 */
export function removeServerHead() {
    document.head.querySelectorAll("[data-server-head]").forEach((el) => el.remove());
    // The server's <title> replaces the default one from index.html; restore
    // that default when no other title is left, so the tab keeps a name.
    if (!document.querySelector("title")) document.title = "Sibra Inmobiliaria";
}
