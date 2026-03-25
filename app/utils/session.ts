import { createCookie } from "remix/cookie"
import { createCookieSessionStorage } from "remix/session/cookie-storage"

import { env } from "../constants"

export let sessionCookie = createCookie("session", {
	secrets: [env.SESSION_SECRET],
	httpOnly: true,
	sameSite: "Lax",
	maxAge: 60 * 60 * 24 * 30, // 30 days
	path: "/",
	secure: import.meta.env.PROD,
})

export let sessionStorage = createCookieSessionStorage()
