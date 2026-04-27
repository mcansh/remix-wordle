import { defineConfig } from "oxfmt"

export default defineConfig({
	printWidth: 80,
	ignorePatterns: ["app/generated/**", ".agents/**/*"],
	experimentalSortImports: {},
	experimentalSortPackageJson: true,
	experimentalTailwindcss: {
		attributes: ["class", "className"],
		functions: ["clsx", "cn"],
		preserveDuplicates: false,
		preserveWhitespace: false,
	},
	semi: false,
	useTabs: true,
})
