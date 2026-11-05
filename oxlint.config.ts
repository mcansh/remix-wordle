import type { OxlintConfig } from "oxlint"
import { defineConfig } from "oxlint"

export const IGNORE_PATTERNS = [
	".agent/**",
	".agents/**",
	".claude/**",
	".codex/**",
	".continue/**",
	".cursor/**",
	".gemini/**",
	".opencode/**",
	".pi/**",
	".roo/**",
	".windsurf/**",
	"**/coverage/**",
	"app/generated/**",
	"node_modules/**",
	"pnpm-lock.yaml",
	"pnpm-workspace.yaml",
	"tools/oxlint/anti-slop/**",
	"dist/**",
] as const satisfies OxlintConfig["ignorePatterns"]

export default defineConfig({
	categories: {
		correctness: "off",
		nursery: "off",
		pedantic: "off",
		perf: "off",
		restriction: "off",
		style: "off",
		suspicious: "off",
	},
	env: {
		builtin: true,
	},
	ignorePatterns: IGNORE_PATTERNS,
	jsPlugins: [{ name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" }],
	options: {
		typeAware: true,
	},
	settings: {
		jsdoc: {
			ignorePrivate: true,
			tagNamePreference: {
				return: "return",
				category: "category",
			},
		},
	},
	rules: {
		"no-unused-vars": "off",
		"no-unused-expressions": "off",
		"no-useless-escape": "off",
		"no-async-promise-executor": "off",
		"no-control-regex": "off",
		"no-useless-catch": "off",
	},
	overrides: [
		{
			files: ["**/*.{ts,tsx}"],
			plugins: ["typescript", "import"],
			jsPlugins: [
				"./tools/oxlint/interface-pascal-case-plugin.ts",
				"./tools/oxlint/no-typescript-accessibility-plugin.ts",
				"./oxlint-plugins/prefer-import-alias-plugin.ts",
			],
			rules: {
				"import/consistent-type-specifier-style": ["error", "prefer-top-level"],
				"typescript/consistent-type-imports": [
					"error",
					{ prefer: "type-imports", fixStyle: "separate-type-imports" },
				],
				"typescript/consistent-type-exports": [
					"error",
					{ fixMixedExportsWithInlineTypeSpecifier: false },
				],
				"import/extensions": ["error", "always", { ignorePackages: true }],
				"import/newline-after-import": "error",
				"remix-interface/interface-pascal-case": "error",
				"remix-typescript/no-typescript-accessibility": "error",
				"prefer-import-alias/prefer-import-alias": "error",
			},
		},
		{
			files: ["**/*.{ts,tsx,js,jsx}"],
			jsPlugins: [
				"./tools/oxlint/prefer-let-locals-plugin.ts",
				"./tools/oxlint/canonical-header-names-plugin.ts",
				"./tools/oxlint/jsx-no-leaked-render-plugin.ts",
			],
			rules: {
				"remix-jsx/jsx-no-leaked-render": "error",
				"remix-headers/canonical-header-name": "error",
				"remix-style/prefer-const-module-scope": "error",
				"remix-style/prefer-let-locals": "error",
				"no-var": "error",
				"arrow-body-style": ["error", "as-needed"],
			},
		},
		{
			files: ["**/*.{test,spec}.{ts,tsx,js,jsx}"],
			rules: {
				"remix-headers/canonical-header-name": "off",
			},
		},
	],
})
