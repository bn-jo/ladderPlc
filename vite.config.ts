import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// On GitHub Pages the app is served from https://<user>.github.io/ladderPlc/,
// so production assets need the repo name as the base path. Dev stays at "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/ladderPlc/" : "/",
  plugins: [react()],
}));
