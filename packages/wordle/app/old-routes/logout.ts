import { redirect, unstable_defineAction, unstable_defineLoader } from "@remix-run/node";

import { logout } from "~/session.server";

export const loader = unstable_defineLoader(async () => {
  return redirect("/");
});

export const action = unstable_defineAction(async ({ request }) => {
  return logout(request);
});
