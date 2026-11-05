import { loadEnvFile } from "node:process"

import { svgSprite } from "@mcansh/vite-plugin-svg-sprite"
import tailwindcss from "@tailwindcss/vite"
import { remix } from "pitlane/vite-plugin-remix"
import { defineConfig } from "vite"
import devtoolsJson from "vite-plugin-devtools-json"

try {
	loadEnvFile(".env")
} catch {}

export default defineConfig({
	server: { port: 44100 },
	plugins: [remix(), devtoolsJson(), tailwindcss(), svgSprite()],
})
