import type { HttpHandler } from "msw";

import { http, passthrough } from "msw";

function randomNumberBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function delay(delay: number | undefined): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export let handlers = [
  // Intercept all HTTP requests.
  http.all("*", async () => {
    // Apply random delay to them.
    await delay(randomNumberBetween(100, 3_000));
    // Then resolve them as-is, no mocking.
    return passthrough();
  }),
] satisfies Array<HttpHandler>;
