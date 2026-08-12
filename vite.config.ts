import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // "./" keeps dist/ portable: it can be served from a domain root, a
  // sub-folder (GitHub Pages) or even opened from the filesystem.
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2022",
    assetsInlineLimit: 2048,
  },
});
