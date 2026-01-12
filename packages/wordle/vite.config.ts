import { remix } from "@jacob-ebey/vite-plugin-remix";
import { svgSprite } from "@mcansh/vite-plugin-svg-sprite";
import tailwindcss from "@tailwindcss/vite";
import { loadEnvFile } from "node:process";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

try {
  loadEnvFile(".env");
} catch {}

export default defineConfig({
  builder: {
    async buildApp(builder) {
      await builder.build(builder.environments.ssr);
      await builder.build(builder.environments.client);
    },
  },
  environments: {
    client: {
      build: {
        outDir: "./dist/client",
        rollupOptions: {
          input: "./app/entry.browser",
        },
      },
    },
    ssr: {
      build: {
        outDir: "./dist/ssr",
        rollupOptions: {
          input: "./app/entry.server",
        },
      },
    },
  },
  plugins: [remix(), devtoolsJson(), tailwindcss(), svgSprite()],
});
