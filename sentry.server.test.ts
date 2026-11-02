import { expect, it, vi } from "vite-plus/test"

const sentry = vi.hoisted(() => ({
	init: vi.fn(),
	captureException: vi.fn(() => "event-id"),
	flush: vi.fn(async () => true),
	loads: 0,
}))

vi.mock("@sentry/node", () => {
	sentry.loads += 1
	return {
		init: sentry.init,
		captureException: sentry.captureException,
		flush: sentry.flush,
	}
})

const DSN = "https://public@o0.ingest.sentry.io/1"
const OTHER_DSN = "https://public@o0.ingest.sentry.io/2"

const mechanism = { type: "remix-wordle.server", handled: false }

function expectInitOptions(dsn: string) {
	expect(sentry.init).toHaveBeenCalledTimes(1)
	let [options] = sentry.init.mock.calls[0] ?? []
	expect(options).toMatchObject({
		dsn,
		tracesSampleRate: 0,
		enableRuntimeChannelInjection: false,
	})
	expect(options.integrations).toEqual(expect.any(Function))
	expect(
		options.integrations([
			{ name: "Http" },
			{ name: "Http.Server" },
			{ name: "RequestData" },
			{ name: "OnUncaughtException" },
		]),
	).toEqual([{ name: "OnUncaughtException" }])
}

async function loadReporter() {
	vi.resetModules()
	sentry.init.mockReset()
	sentry.captureException.mockReset()
	sentry.flush.mockReset()
	sentry.flush.mockImplementation(async () => true)
	sentry.captureException.mockImplementation(() => "event-id")
	sentry.loads = 0
	return import("./sentry.server.ts")
}

it("stays idle when SENTRY_DSN is missing, empty, or whitespace", async () => {
	let envs = [{}, { SENTRY_DSN: "" }, { SENTRY_DSN: " \t\n " }]
	for (let env of envs) {
		let { installServerReporter, reportRequestError, flushServerReporter, serverReporterFromEnv } =
			await loadReporter()
		expect(serverReporterFromEnv(env)).toEqual({ state: "idle" })
		let reporter = await installServerReporter(env)
		expect(reporter).toEqual({ state: "idle" })
		expect(sentry.loads).toBe(0)
		expect(sentry.init).not.toHaveBeenCalled()
		expect(reportRequestError(new Error("boom"))).toBe("idle")
		await flushServerReporter()
		expect(sentry.flush).not.toHaveBeenCalled()
	}
})

it("parses any trimmed string and does not check URL shape", async () => {
	let { serverReporterFromEnv, installServerReporter } = await loadReporter()
	expect(serverReporterFromEnv({ SENTRY_DSN: `  ${DSN}  ` })).toEqual({
		state: "has-dsn",
		dsn: DSN,
	})
	expect(serverReporterFromEnv({ SENTRY_DSN: "not a url" })).toEqual({
		state: "has-dsn",
		dsn: "not a url",
	})
	expect(sentry.loads).toBe(0)

	let reporter = await installServerReporter({ SENTRY_DSN: "not a url" })
	expect(reporter).toEqual({ state: "armed", dsn: "not a url" })
	expect(sentry.loads).toBe(1)
	expectInitOptions("not a url")
})

it("initializes once and captures a thrown error", async () => {
	let { installServerReporter, reportRequestError } = await loadReporter()
	let reporter = await installServerReporter({ SENTRY_DSN: `  ${DSN}  ` })
	expect(reporter).toEqual({ state: "armed", dsn: DSN })
	expectInitOptions(DSN)

	let boom = new Error("boom")
	expect(reportRequestError(boom)).toBe("captured")
	expect(sentry.captureException).toHaveBeenCalledTimes(1)
	expect(sentry.captureException).toHaveBeenCalledWith(boom, { mechanism })
})

it("ignores a 404 response and a client abort", async () => {
	let { installServerReporter, reportRequestError } = await loadReporter()
	await installServerReporter({ SENTRY_DSN: DSN })

	expect(reportRequestError(new Response("missing", { status: 404 }))).toBe("ignored")
	expect(reportRequestError({ status: 300 })).toBe("ignored")
	expect(reportRequestError({ status: 499 })).toBe("ignored")
	expect(reportRequestError(new Response("redirect", { status: 302 }))).toBe("ignored")

	let controller = new AbortController()
	controller.abort()
	expect(reportRequestError(controller.signal.reason, controller.signal)).toBe("ignored")
	expect(reportRequestError(new DOMException("The operation was aborted.", "AbortError"))).toBe(
		"ignored",
	)

	let boom = new Error("boom")
	expect(reportRequestError(boom, controller.signal)).toBe("captured")
	expect(reportRequestError(new Response("nope", { status: 500 }))).toBe("captured")
	expect(reportRequestError({ status: 299 })).toBe("captured")
	expect(reportRequestError({ status: "404" })).toBe("captured")

	expect(sentry.captureException).toHaveBeenCalledWith(boom, { mechanism })
	expect(sentry.captureException.mock.calls[0]).toEqual([boom, { mechanism }])
})

it("keeps the first install when a later env differs", async () => {
	let { installServerReporter } = await loadReporter()
	let first = await installServerReporter({ SENTRY_DSN: DSN })
	let second = await installServerReporter({ SENTRY_DSN: OTHER_DSN })
	expect(first).toEqual({ state: "armed", dsn: DSN })
	expect(second).toEqual(first)
	expectInitOptions(DSN)
})

it("returns idle before install resolves and does not queue the error", async () => {
	let { installServerReporter, reportRequestError } = await loadReporter()
	let pending = installServerReporter({ SENTRY_DSN: DSN })
	expect(reportRequestError(new Error("early"))).toBe("idle")
	expect(sentry.captureException).not.toHaveBeenCalled()
	await pending
	let boom = new Error("boom")
	expect(reportRequestError(boom)).toBe("captured")
	expect(sentry.captureException).toHaveBeenCalledTimes(1)
	expect(sentry.captureException).toHaveBeenCalledWith(boom, { mechanism })
})

it("stays idle when init throws and does not call init again", async () => {
	let { installServerReporter, reportRequestError } = await loadReporter()
	let consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
	sentry.init.mockImplementation(() => {
		throw new Error("init failed")
	})

	try {
		let first = await installServerReporter({ SENTRY_DSN: DSN })
		let second = await installServerReporter({ SENTRY_DSN: OTHER_DSN })
		expect(first).toEqual({ state: "idle" })
		expect(second).toEqual({ state: "idle" })
		expect(sentry.init).toHaveBeenCalledTimes(1)
		expect(reportRequestError(new Error("boom"))).toBe("idle")
		expect(sentry.captureException).not.toHaveBeenCalled()
		expect(consoleError).toHaveBeenCalled()
	} finally {
		consoleError.mockRestore()
	}
})

it("returns failed when captureException throws", async () => {
	let { installServerReporter, reportRequestError } = await loadReporter()
	let consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
	await installServerReporter({ SENTRY_DSN: DSN })
	sentry.captureException.mockImplementation(() => {
		throw new Error("capture failed")
	})

	try {
		expect(reportRequestError(new Error("boom"))).toBe("failed")
		expect(consoleError).toHaveBeenCalled()
	} finally {
		consoleError.mockRestore()
	}
})

it("flushes an armed client with a 2000 ms bound", async () => {
	let { installServerReporter, flushServerReporter } = await loadReporter()
	let consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined)
	await installServerReporter({ SENTRY_DSN: DSN })

	try {
		await flushServerReporter()
		expect(sentry.flush).toHaveBeenCalledTimes(1)
		expect(sentry.flush).toHaveBeenCalledWith(2000)

		await flushServerReporter()
		expect(sentry.flush).toHaveBeenCalledTimes(2)

		sentry.flush.mockRejectedValueOnce(new Error("flush failed"))
		await expect(flushServerReporter()).resolves.toBeUndefined()

		sentry.flush.mockImplementationOnce(() => {
			throw new Error("flush sync")
		})
		await expect(flushServerReporter()).resolves.toBeUndefined()
		expect(consoleError).toHaveBeenCalled()
	} finally {
		consoleError.mockRestore()
	}
})

it("reads the install argument and ignores process.env", async () => {
	let previous = process.env.SENTRY_DSN
	process.env.SENTRY_DSN = DSN
	try {
		let { installServerReporter, reportRequestError } = await loadReporter()
		let reporter = await installServerReporter({})
		expect(reporter).toEqual({ state: "idle" })
		expect(sentry.loads).toBe(0)
		expect(sentry.init).not.toHaveBeenCalled()
		expect(reportRequestError(new Error("boom"))).toBe("idle")
	} finally {
		if (previous === undefined) {
			delete process.env.SENTRY_DSN
		} else {
			process.env.SENTRY_DSN = previous
		}
	}
})
