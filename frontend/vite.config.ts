import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        tanstackRouter({ autoCodeSplitting: true }),
        viteReact(),
        tailwindcss(),
    ],
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
        target: 'esnext',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react/jsx-runtime', 'scheduler'],
                    'tanstack': [
                        '@tanstack/react-query',
                        '@tanstack/react-router',
                    ],
                    'radix-ui': [
                        '@radix-ui/react-checkbox',
                        '@radix-ui/react-collapsible',
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-label',
                        '@radix-ui/react-navigation-menu',
                        '@radix-ui/react-popover',
                        '@radix-ui/react-radio-group',
                        '@radix-ui/react-scroll-area',
                        '@radix-ui/react-select',
                        '@radix-ui/react-separator',
                        '@radix-ui/react-slot',
                        '@radix-ui/react-tabs',
                        '@radix-ui/react-tooltip',
                    ],
                    'animations': ['@gsap/react'],
                    'forms': [
                        'zod',
                        '@hookform/resolvers',
                        'react-hook-form',
                    ],
                    'maps': ['@vis.gl/react-google-maps'],
                    'icons': ['lucide-react'],
                },
            }
        },
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@tanstack/react-query',
            '@tanstack/react-router',
        ],
    },
});
