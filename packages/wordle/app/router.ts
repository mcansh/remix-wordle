import { asyncContext } from "@remix-run/async-context-middleware";
import { compression } from "@remix-run/compression-middleware";
import { createRouter } from "@remix-run/fetch-router";
import { formData } from "@remix-run/form-data-middleware";
// import { routes } from './routes.ts'
// import { sessionCookie, sessionStorage } from './utils/session.ts'
import { logger } from "@remix-run/logger-middleware";
import { methodOverride } from "@remix-run/method-override-middleware";
// import { session } from '@remix-run/session-middleware'
import { staticFiles } from "@remix-run/static-middleware";

import * as marketingController from "./home.tsx";
import { routes } from "./routes.ts";

let middleware = [];

if (process.env.NODE_ENV === "development") {
  middleware.push(logger());
}

middleware.push(compression());
middleware.push(
  staticFiles("./public", {
    cacheControl: "no-store, must-revalidate",
    etag: false,
    lastModified: false,
  }),
);
middleware.push(formData());
middleware.push(methodOverride());
// middleware.push(session(sessionCookie, sessionStorage))
middleware.push(asyncContext());

export let router = createRouter({ middleware });

router.map(routes.home.index, marketingController.home);
router.map(routes.home.action, marketingController.action);
