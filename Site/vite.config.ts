import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    target: "esnext",          // Output menor — remove polyfills desnecessários
    cssCodeSplit: true,        // CSS por chunk — carrega só o necessário por rota
    assetsInlineLimit: 4096,   // Inlina assets <= 4KB como base64 (menos requests)
    chunkSizeWarningLimit: 700,
    reportCompressedSize: false, // Build mais rápido (Cloudflare já reporta)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (
            id.includes("react-dom") ||
            id.includes("\\react\\") ||
            id.includes("/react/") ||
            id.includes("scheduler")
          ) {
            return "vendor-react";
          }

          if (id.includes("react-router-dom")) {
            return "vendor-router";
          }

          if (id.includes("@tanstack")) {
            return "vendor-query";
          }

          if (id.includes("framer-motion") || id.includes("embla-carousel-react")) {
            return "vendor-motion";
          }

          if (id.includes("@supabase")) {
            return "vendor-supabase";
          }

          if (id.includes("hls.js")) {
            return "vendor-player";
          }

          if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul") || id.includes("sonner")) {
            return "vendor-ui";
          }

          if (id.includes("date-fns")) {
            return "vendor-date";
          }

          if (id.includes("lucide-react")) {
            return "vendor-icons";
          }
        },
      },
    },
  },
}));
