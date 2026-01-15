// import { routes } from '../routes.ts'
import type { Remix } from "@remix-run/dom"

export async function resolveFrame(frameSrc: string): Promise<Remix.RemixElement> {
	let url = new URL(frameSrc, "http://localhost:44100")

	console.log(`[frame] fetching frame from ${url.href}`)

	throw new Error(`Failed to fetch ${frameSrc}`)
}
