# remix-wordle

A Wordle game on Remix.

## Run the app

`vp dev` starts the dev server on port 44100. `vp build` writes the client bundle and the server bundle. `npm start` runs the production server.

## Report production server errors

Set `SENTRY_DSN` in the environment to send thrown request errors from the production server. Railway already has the variable. Leave `SENTRY_DSN` unset on a local machine and in CI. A missing DSN is a no-op. An empty or whitespace-only value is also a no-op. The process still starts, and the server sends nothing. Do not commit a DSN.

`npm start` runs `node --import ./instrument.server.ts ./server.ts`. That import loads the Sentry SDK before app code. The SDK starts with `tracesSampleRate` set to 0, so it does not record traces.

`vp dev` does not run `server.ts`. A request handled by the dev server is not reported.
