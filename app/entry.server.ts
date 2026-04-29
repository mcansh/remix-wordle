import { router } from "./router.ts"

export default {
	async fetch(request: Request) {
		return await router.fetch(request)
	},
}

if (import.meta.hot) {
	import.meta.hot.accept()
}
