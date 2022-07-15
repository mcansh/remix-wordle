import invariant from "tiny-invariant";
import { createCookieSessionStorage } from "@remix-run/node";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secrets: [process.env.SESSION_SECRET],
    sameSite: "strict",
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
});

export function getSession(input: Request | string | undefined | null) {
  let cookie = input instanceof Request ? input.headers.get("Cookie") : input;
  return sessionStorage.getSession(cookie);
}
