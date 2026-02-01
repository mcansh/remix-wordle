import { get, post, route, form } from "@remix-run/fetch-router"

export let routes = route({
	home: form("/"),
	health: get("health"),

	history: route("history", {
		index: get("/"),
		game: get(":date"),
	}),

	auth: {
		login: form("login"),
		register: form("register"),
		logout: post("logout"),
		forgotPassword: form("forgot-password"),
		resetPassword: form("reset-password/:token"),
	},
})
