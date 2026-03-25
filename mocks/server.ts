import { createMiddleware } from "@mswjs/http-middleware"

import { handlers } from "./handlers.ts"

export const middleware = createMiddleware(...handlers)
