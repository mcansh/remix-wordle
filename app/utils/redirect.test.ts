import { expect, it } from "vitest"

import { safeRedirect } from "./redirect"

it("safeRedirect returns default for null", () => {
	expect(safeRedirect(null)).toBe("/")
})

it("safeRedirect returns default for undefined", () => {
	expect(safeRedirect(undefined)).toBe("/")
})

it("safeRedirect returns default for empty string", () => {
	expect(safeRedirect("")).toBe("/")
})

it("safeRedirect returns default for non-string", () => {
	expect(safeRedirect(42 as any)).toBe("/")
})

it("safeRedirect returns default for absolute URL", () => {
	expect(safeRedirect("http://malicious.com")).toBe("/")
})

it("safeRedirect returns default for protocol-relative URL", () => {
	expect(safeRedirect("//malicious.com")).toBe("/")
})

it("safeRedirect returns the path for valid relative URL", () => {
	expect(safeRedirect("/dashboard")).toBe("/dashboard")
})

it("safeRedirect uses custom default redirect", () => {
	expect(safeRedirect(null, "/home")).toBe("/home")
})

it("safeRedirect returns the path for valid relative URL with query", () => {
	expect(safeRedirect("/search?query=test")).toBe("/search?query=test")
})

it("safeRedirect returns default for path not starting with /", () => {
	expect(safeRedirect("dashboard")).toBe("/")
})
