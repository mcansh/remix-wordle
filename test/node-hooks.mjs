const dbMock = new URL("./mocks/db.ts", import.meta.url).href
const bcryptMock = new URL("./mocks/bcryptjs.ts", import.meta.url).href
const assetStub = new URL("./stubs/asset.ts", import.meta.url).href

export async function resolve(specifier, context, nextResolve) {
	if (specifier === "bcryptjs") {
		return { url: bcryptMock, shortCircuit: true }
	}

	if (
		specifier.includes("?url") ||
		specifier.includes("?assets=") ||
		/\.(svg|css)(\?|$)/.test(specifier)
	) {
		return { url: assetStub, shortCircuit: true }
	}

	let resolved
	try {
		resolved = await nextResolve(specifier, context)
	} catch (error) {
		if (specifier.includes("?") || /\.(svg|css)$/.test(specifier)) {
			return { url: assetStub, shortCircuit: true }
		}
		throw error
	}

	if (resolved.url.includes("/app/utils/db.ts")) {
		return { url: dbMock, shortCircuit: true }
	}

	return resolved
}
