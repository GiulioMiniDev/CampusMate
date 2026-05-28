import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import basicSsl from "@vitejs/plugin-basic-ssl";

const useHttps = process.env.CAMPUSMATE_HTTPS === "1";

export default defineConfig({
  plugins: [
    vue(),
    useHttps ? basicSsl() : null
  ].filter(Boolean),
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true
      },
      "/ws": {
        target: "ws://127.0.0.1:8000",
        ws: true
      }
    }
  }
});
