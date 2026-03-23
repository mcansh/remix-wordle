import { loadEnvFile } from "node:process"

import { remix } from "@mcansh/vite-plugin-remix"
import { svgSprite } from "@mcansh/vite-plugin-svg-sprite"
import tailwindcss from "@tailwindcss/vite"
import { DevTools } from "@vitejs/devtools"
import { defineConfig } from "vite"
import devtoolsJson from "vite-plugin-devtools-json"

try {
	loadEnvFile(".env")
} catch {}

export default defineConfig({
	server: { port: 44100 },
	builder: {
		async buildApp(builder) {
			if (builder.environments.ssr == null) {
				throw new Error("missing ssr environment")
			}
			if (builder.environments.client == null) {
				throw new Error("missing client environment")
			}
			await builder.build(builder.environments.ssr)
			await builder.build(builder.environments.client)
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
	build: {
		rolldownOptions: {
			devtools: {}, // enable devtools mode
		},
	},
	plugins: [remix(), devtoolsJson(), tailwindcss(), svgSprite(), DevTools()],
})
