import { downwind } from "@arnaud-barre/downwind/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({  
  plugins: [downwind(), react()],
  css: {
    transformer: "lightningcss",
  },
  build: {
    cssMinify: "lightningcss",
  },
});
