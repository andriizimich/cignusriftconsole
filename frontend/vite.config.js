import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  envPrefix: ["VITE_", "REACT_APP_"],
  build: { outDir: "build" },
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 3000,
    strictPort: true,
    allowedHosts: true,
    hmr: { clientPort: 443, protocol: "wss" },
  },
});
