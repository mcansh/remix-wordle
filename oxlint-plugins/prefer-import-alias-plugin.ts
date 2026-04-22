import fs from "node:fs"
import path from "node:path"

import type { Context, ESTree, Fixer } from "@oxlint/plugins"
import { definePlugin, defineRule } from "@oxlint/plugins"

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"]

function findFileWithExtension(dir: string, baseName: string): string | null {
	for (let ext of EXTENSIONS) {
		let fullPath = path.join(dir, baseName + ext)
		if (fs.existsSync(fullPath)) {
			return path.posix.join(baseName + ext)
		}
	}

	for (let ext of EXTENSIONS) {
		let indexPath = path.join(dir, baseName, "index" + ext)
		if (fs.existsSync(indexPath)) {
			return path.posix.join(baseName, "index" + ext)
		}
	}

	return null
}

function resolveRelativeImport(
	importPath: string,
	currentFilePath: string,
	cwd: string,
): string | null {
	if (!importPath.startsWith("../")) {
		return null
	}

	let currentDir = path.dirname(currentFilePath)
	let targetPath = path.resolve(currentDir, importPath)

	let dir = path.dirname(targetPath)
	let baseName = path.basename(targetPath)
	let ext = path.extname(targetPath)

	if (!ext) {
		let withExt = findFileWithExtension(dir, baseName)
		if (withExt) {
			importPath = importPath.replace(/[^/]+$/, withExt)
		} else {
			importPath += ".js"
		}
	}

	let resolvedTargetPath = path.resolve(currentDir, importPath)
	let relativeToCwd = path.relative(cwd, resolvedTargetPath)

	let importAlias = "#/" + relativeToCwd.replace(/\\/g, "/")

	return importAlias
}

function replacer(fixer: Fixer, node: ESTree.ImportDeclaration, context: Context) {
	let source = node.source.value
	if (typeof source !== "string") {
		return null
	}

	if (!source.startsWith("../")) {
		return null
	}

	let resolved = resolveRelativeImport(source, context.filename, context.cwd)
	if (!resolved) {
		return null
	}

	return fixer.replaceText(node.source, `"${resolved}"`)
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

				let resolved = resolveRelativeImport(node.source.value, context.filename, context.cwd)

				if (!resolved) {
					return
				}

				context.report({
					node,
					message: "Use import alias instead of relative path",
					suggest: [
						{
							fix(fixer: Fixer) {
								return replacer(fixer, node, context)
							},
							desc: "Replace with import alias",
						},
					],
					fix(fixer: Fixer) {
						return replacer(fixer, node, context)
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
