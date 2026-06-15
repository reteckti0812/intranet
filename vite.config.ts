import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // Mesma origem que o front. Documentos de departamento saem por /api/documents;
    // /docs serve apenas os anexos da Home (Lista Mestra / Documentos Gerais).
    proxy: {
      "/api": { target: "http://127.0.0.1:3001", changeOrigin: true },
      "/docs": { target: "http://127.0.0.1:3001", changeOrigin: true },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
