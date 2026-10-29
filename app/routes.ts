import { form, get, post, route } from "remix/fetch-router/routes"

export const routes = route({
	home: form("/"),
	health: get("health"),
	robots: get("robots.txt"),
	sitemap: get("sitemap.xml"),

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
