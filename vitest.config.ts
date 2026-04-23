import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		exclude: [
			"./app/generated/**",
			"./node_modules/**",
			".git/**",
			"./dist/**",
		],
		environment: "happy-dom",
		setupFiles: ["./test.setup.ts"],
	},
})
