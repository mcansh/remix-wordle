import { defineConfig } from "tsdown"
export default defineConfig({
	entry: {
		index: "./src/vite-plugin-remix.ts",
		types: "./src/types.ts",
		runtime: "./src/runtime.ts",
	},
	attw: { profile: "esm-only" },
	publint: true,
	format: "esm",
	exports: {
		devExports: true,
	},
})
