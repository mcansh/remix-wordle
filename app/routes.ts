import { form, get, post, route } from "remix/fetch-router/routes"

export const assetsBase = "/assets"

export const routes = route({
	assets: `${assetsBase}/*path`,

	home: form("/"),
	health: get("health"),

	history: route("history", {
		index: get("/"),
		game: get(":id"),
	}),

	auth: {
		login: form("login"),
		register: form("register"),
		logout: post("logout"),
		forgotPassword: form("forgot-password"),
		resetPassword: form("reset-password/:token"),
	},
})
