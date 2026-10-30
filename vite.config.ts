import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import accessHandler from "./api/access.ts";
import adminHandler from "./api/admin.ts";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) {
      process.env[k] = v;
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "neon-local-api",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith("/api/access")) {
              await accessHandler(req, res);
              return;
            }
            if (req.url?.startsWith("/api/admin")) {
              await adminHandler(req, res);
              return;
            }
            next();
          });
        },
      },
    ],
    server: {
      host: true,
      port: 5173,
    },
  };
});
