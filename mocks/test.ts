import { setupServer } from "msw/node"

import { handlers } from "./handlers.ts"

const server = setupServer(...handlers)
server.listen({ onUnhandledRequest: "warn" })
console.info("🔶 Mock server running")

process.once("SIGINT", () => server.close())
process.once("SIGTERM", () => server.close())
