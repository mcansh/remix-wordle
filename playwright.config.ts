import { defineConfig } from "playwright/test"

export default defineConfig({
	projects: [{ name: "chromium", use: { browserName: "chromium" } }],
	use: {
		actionTimeout: 15_000,
		navigationTimeout: 15_000,
	},
})
