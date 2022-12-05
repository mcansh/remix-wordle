import { createCookieSessionStorage, redirect } from "@remix-run/node";
import type { User } from "@prisma/client";

import { getUserById } from "./models/user.server";
import { NODE_ENV, SESSION_SECRET } from "./constants.server";

export let sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    secrets: [SESSION_SECRET],
    sameSite: "strict",
    httpOnly: true,
    path: "/",
    secure: NODE_ENV === "production",
  },
});

let USER_SESSION_KEY = "userId";

export async function getSession(request: Request) {
  let cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUserId(
  request: Request
): Promise<User["id"] | undefined> {
  let session = await getSession(request);
  let userId = session.get(USER_SESSION_KEY);
  return userId;
}

export async function getUser(request: Request) {
  let userId = await getUserId(request);
  if (userId === undefined) return null;

  let user = await getUserById(userId);
  if (user) return user;

  throw await logout(request);
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  let userId = await getUserId(request);
  if (!userId) {
    let searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function requireUser(request: Request) {
  let userId = await requireUserId(request);

  let user = await getUserById(userId);
  if (user) return user;

  throw await logout(request);
}

export async function createUserSession({
  request,
  userId,
  remember,
  redirectTo,
}: {
  request: Request;
  userId: string;
  remember: boolean;
  redirectTo: string;
}) {
  let session = await getSession(request);
  session.set(USER_SESSION_KEY, userId);
  // 1 year or until the window is closed
  let maxAge = remember ? 60 * 60 * 24 * 365 : undefined;
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session, { maxAge }),
    },
  });
}

export async function logout(request: Request) {
  let session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}
