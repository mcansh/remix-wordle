import { describe, expect, it, vi } from "vitest";

import type { FullGame } from "./models/game.ts";

import { assertContains, loginAsCustomer, requestWithSession } from "../test/helpers.ts";
import { router } from "./router.ts";

vi.mock("./models/game.ts", async (importActual) => {
  let actual = await importActual<typeof import("./models/game.ts")>();

  return {
    ...actual,
    createGame: vi.fn().mockImplementation(async () => {
      return {
        id: "game-123",
        word: "apple",
        status: "IN_PROGRESS",
        createdAt: new Date(),
        updatedAt: new Date(),
        guesses: [],
      } satisfies FullGame;
    }),
    getTodaysGame: vi.fn().mockImplementation(async () => {
      return {
        id: "game-123",
        word: "apple",
        status: "IN_PROGRESS",
        createdAt: new Date(),
        updatedAt: new Date(),
        guesses: [],
      } satisfies FullGame;
    }),
  };
});

vi.mock("./models/user.ts", async (importActual) => {
  let actual = await importActual<typeof import("./models/user.ts")>();

  return {
    ...actual,
    authenticateUser: vi.fn().mockImplementation(async (email: string, password: string) => {
      if (email === "customer@example.com" && password === "password123") {
        return {
          id: "user-123",
          email,
          username: "testuser",
          password: "hashed-password", // In real case, this would be hashed
        };
      }

      return null;
    }),
    getUserById: vi.fn().mockImplementation(async (id: string) => {
      if (id === "user-123") {
        return {
          id: "user-123",
          email: "customer@example.com",
          username: "testuser",
          password: "hashed-password", // In real case, this would be hashed
        };
      }

      return null;
    }),
  };
});

describe("marketing handlers", () => {
  it.only("GET / returns home page", async () => {
    let sessionId = await loginAsCustomer(router);
    let request = requestWithSession("https://remix.run/", sessionId);
    let response = await router.fetch(request);

    expect(response.status).toBe(200);
    let html = await response.text();
    assertContains(html, "Remix Wordle");
    assertContains(html, "Submit Guess");
  });

  it("POST /contact returns success message", async () => {
    let response = await router.fetch("https://remix.run/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        name: "Test User",
        email: "test@example.com",
        message: "Test message",
      }).toString(),
    });

    expect(response.status).toBe(200);
    let html = await response.text();
    assertContains(html, "Thank you for your message");
  });
});
