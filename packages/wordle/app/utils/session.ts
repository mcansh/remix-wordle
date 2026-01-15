import { createCookie } from "@remix-run/cookie"
import { createCookieSessionStorage } from "@remix-run/session/cookie-storage"

import { env } from "../constants"

export let sessionCookie = createCookie("session", {
	secrets: [env.SESSION_SECRET],
	httpOnly: true,
	sameSite: "Lax",
	maxAge: 2592000, // 30 days
	path: "/",
})

export let sessionStorage = createCookieSessionStorage()
