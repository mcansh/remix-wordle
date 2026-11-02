declare module "./dist/ssr/index.js" {
	let ssr: {
		fetch(request: Request): Response | Promise<Response>
	}
	export default ssr
}
