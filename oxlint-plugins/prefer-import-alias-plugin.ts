import type { Context, ESTree, Fixer } from "@oxlint/plugins"
import { definePlugin, defineRule } from "@oxlint/plugins"

function replacer(fixer: Fixer, node: ESTree.ImportDeclaration) {
	let source = node.source.value
	if (typeof source !== "string") {
		return null
	}

	let newSource = source.replace(/^\.\/(.*)/, "#$1").replace(/^\.\.\/(.*)/, "#$1")

	return fixer.replaceText(node.source, `"${newSource}"`)
}

const preferImportAliasRule = defineRule({
	meta: {
		type: "suggestion",
		fixable: "code",
		hasSuggestions: true,
	},
	create(context: Context) {
		return {
			ImportDeclaration(node: ESTree.ImportDeclaration) {
				if (node.specifiers.length === 0) {
					return
				}

				if (!node.source.value.startsWith("../")) {
					return
				}

				context.report({
					node,
					message: "Use import aliases for deep imports",
					data: {},
					suggest: [
						{
							fix(fixer: Fixer) {
								return replacer(fixer, node)
							},
							desc: "Replace with import alias",
						},
					],
					fix(fixer: Fixer) {
						return replacer(fixer, node)
					},
				})
			},
		}
	},
})

export default definePlugin({
	meta: {
		name: "prefer-import-alias",
	},
	rules: {
		"prefer-import-alias": preferImportAliasRule,
	},
})
