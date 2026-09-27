/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Content-Security-Policy for the built app. The only network destination is
 * OpenRouter (AI assist); everything else is same-origin. Inline styles are
 * needed by Recharts and the PDF renderer. Delivered as a <meta> tag so it
 * also protects static hosts that can't set headers (GitHub Pages); nginx
 * sends the same policy as a header plus frame-ancestors.
 * Keep in sync with nginx.conf.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://openrouter.ai",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

/** "dev" for the /dev/ preview deployment (see .github/workflows/release.yml). */
const channel = process.env.VITE_APP_CHANNEL === "dev" ? "dev" : "prod";
const appName = channel === "dev" ? "Cyber Board Reports (Dev)" : "Cyber Board Reports";

/** Mark the dev build in the tab title. */
function channelTitle(): Plugin {
  return {
    name: "channel-title",
    transformIndexHtml: (html) =>
      channel === "dev" ? html.replace("<title>Cyber Board Reports</title>", `<title>${appName}</title>`) : html,
  };
}

function contentSecurityPolicy(): Plugin {
  return {
    name: "content-security-policy",
    apply: "build",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: CONTENT_SECURITY_POLICY },
        injectTo: "head-prepend",
      },
    ],
  };
}

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    contentSecurityPolicy(),
    channelTitle(),
    // Precache the static build so the app keeps working offline, matching
    // its local-first promise. Reports never leave the browser either way.
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script-defer",
      manifest: {
        name: appName,
        short_name: channel === "dev" ? "Board Reports Dev" : "Board Reports",
        description: "Local-first cyber security board report editor",
        theme_color: channel === "dev" ? "#b45309" : "#1e3a5f",
        background_color: "#f8fafc",
        display: "standalone",
        start_url: "./",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,ttf,woff2}"],
        // The bundled display font is ~1.6 MB per style.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: "index.html",
        // The dev build lives in /dev/ inside production's service-worker
        // scope. Never answer its navigations with the production app.
        navigateFallbackDenylist: channel === "prod" ? [/\/dev(\/|$)/] : [],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
  },
});
