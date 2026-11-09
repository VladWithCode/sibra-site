import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [tanstackRouter({ autoCodeSplitting: true }), viteReact(), tailwindcss()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            "/api": "http://localhost:8080",
            "/static": "http://localhost:8080",
        },
    },
    build: {
        target: "esnext",
        minify: "terser",
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output: {
                // Only pin the framework core every page needs into one
                // long-cached vendor chunk. Everything else (icons, forms,
                // charts, maps, markdown, animations) is left to Rollup so it
                // lands in the route chunks that actually import it. Grouping
                // whole libraries here forces them into the entry's preload
                // list and defeats lucide's per-icon tree-shaking.
                manualChunks(id) {
                    if (
                        /node_modules\/(react|react-dom|scheduler|@tanstack\/(react-router|router-core|history|react-query|query-core|store|react-store))\//.test(
                            id,
                        )
                    ) {
                        return "vendor";
                    }
                },
            },
        },
    },
    optimizeDeps: {
        include: ["react", "react-dom", "@tanstack/react-query", "@tanstack/react-router"],
    },
});
