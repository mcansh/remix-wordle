import { cleanup } from "@mcansh/remix-testing-library"
import "@testing-library/jest-dom/vitest"
import { afterEach, vi } from "vitest"

process.env.SESSION_SECRET = "test-secret"
process.env.DATABASE_URL = "postgresql://localhost:5432/test"
process.env.REDIS_URL = "redis://localhost:6379"
process.env.NODE_ENV = "test"

vi.mock("remix/data-schema", async () => {
	let actual = await vi.importActual("remix/data-schema")
	return { ...actual }
})

afterEach(cleanup)
