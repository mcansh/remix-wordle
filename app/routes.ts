import { form, get, post, route } from "remix/fetch-router/routes"

export let routes = route({
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
