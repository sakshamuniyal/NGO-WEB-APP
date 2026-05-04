import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()], 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared-types": path.resolve(__dirname, "../backend/src/shared-types/index.ts"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
