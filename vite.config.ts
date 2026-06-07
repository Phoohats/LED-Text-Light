import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// ADR-0001 PWA · ADR-0003 Firebase BaaS (hosting added in Phase 2)
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Pin all Firebase SDK code into one named chunk so the service worker
        // can keep it OUT of the install-time precache (it's loaded on demand).
        manualChunks(id) {
          if (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase")) {
            return "firebase";
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "LED Text Light — ป้ายไฟวิ่ง",
        short_name: "LED Text",
        description: "ป้ายไฟวิ่งสำหรับคอนเสิร์ต รองรับไทย/อังกฤษ/อิโมจิ",
        lang: "th",
        theme_color: "#000000",
        background_color: "#000000",
        display: "fullscreen",
        orientation: "landscape",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff,woff2}"],
        // Keep the heavy Firebase chunk OUT of the install-time precache; it is
        // dynamically imported only when configured, so cache it on first use.
        globIgnores: ["**/firebase-*.js"],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.includes("/firebase-"),
            handler: "CacheFirst",
            options: { cacheName: "firebase-chunk", expiration: { maxEntries: 4 } }
          },
          // ADR-0002 pitfall: cache Google Fonts at runtime so the PWA works offline
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "gfonts-css" }
          },
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "gfonts-files",
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      },
      devOptions: { enabled: false }
    })
  ]
});
