import { asyncContext } from "@remix-run/async-context-middleware";
import { createRouter } from "@remix-run/fetch-router";
import { formData } from "@remix-run/form-data-middleware";
import { logger } from "@remix-run/logger-middleware";
import { methodOverride } from "@remix-run/method-override-middleware";
import { session } from "@remix-run/session-middleware";

import auth from "./auth.tsx";
import history from "./history.tsx";
import home from "./home.tsx";
import { routes } from "./routes.ts";
import { sessionCookie, sessionStorage } from "./utils/session.ts";

let middleware = [];

if (process.env.NODE_ENV === "development") {
  middleware.push(logger());
}

middleware.push(formData());
middleware.push(methodOverride());
middleware.push(session(sessionCookie, sessionStorage));
middleware.push(asyncContext());

export let router = createRouter({ middleware });

router.map(routes.home, home);
router.map(routes.history, history);
router.map(routes.auth, auth);
