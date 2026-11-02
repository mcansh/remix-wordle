import { installServerReporter } from "./sentry.server.ts"

await installServerReporter(process.env)
