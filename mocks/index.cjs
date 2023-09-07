const { rest } = require("msw");
const { setupServer } = require("msw/node");

/**
 * Returns a random number between the given min and max values.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomNumberBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Returns a promise that resolves after the given delay.
 * @param {number} delay
 * @returns {Promise<void>}
 */
async function delay(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/** @type {import('msw').RestHandler[]} */
let handlers = [
  // Intercept all HTTP requests.
  rest.all("*", async (req) => {
    // Apply random delay to them.
    await delay(randomNumberBetween(100, 3_000));
    // Then resolve them as-is, no mocking.
    return req.passthrough();
  }),
];

let server = setupServer(...handlers);
server.listen({ onUnhandledRequest: "warn" });
console.info("🔶 Mock server running");

process.once("SIGINT", () => server.close());
process.once("SIGTERM", () => server.close());
