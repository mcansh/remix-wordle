import { cleanup } from "@mcansh/remix-testing-library"
import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"

afterEach(cleanup)
