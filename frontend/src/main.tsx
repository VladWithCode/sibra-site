import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./index.css";
import { queryClient } from "./queries/queryClient";
import { removeServerHead } from "./lib/serverHead";

// Create a new router instance
const router = createRouter({
    routeTree,
    context: {
        user: null,
        queryClient: queryClient,
    },
    defaultPreload: "intent",
    scrollRestoration: true,
    scrollToTopSelectors: ["#main-content"],
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}

// Load GSAP
gsap.registerPlugin(useGSAP);

// Tags the server injected describe the page it served only; drop them on the
// first in-app navigation. The first load has no previous location, so they
// stay. Subscribed here, not in a component, so it also runs when the root
// error page is showing.
router.subscribe("onResolved", (evt) => {
    if (evt.fromLocation && evt.pathChanged) removeServerHead();
});

// Render the app. #app is empty, or holds the article fallback the Go server
// writes for crawlers (internal/routes/blog_seo.go), which React replaces.
const rootElement = document.getElementById("app");
const serverFallback = rootElement?.querySelector(":scope > [data-blog-ssr]");
if (rootElement && (!rootElement.innerHTML || serverFallback)) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            <RouterProvider router={router} />
        </StrictMode>,
    );
}
