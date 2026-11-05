declare const sentryDsnBrand: unique symbol

export type SentryDsn = string & { readonly [sentryDsnBrand]: true }

export type IdleServerReporter = {
	readonly state: "idle"
}

export type ParsedSentryDsn = {
	readonly state: "has-dsn"
	readonly dsn: SentryDsn
}

export type ServerReporterFromEnv = IdleServerReporter | ParsedSentryDsn

export type ArmedServerReporter = {
	readonly state: "armed"
	readonly dsn: SentryDsn
}

export type ServerReporter = IdleServerReporter | ArmedServerReporter

export type ServerEnv = {
	readonly SENTRY_DSN?: string
}

export type ReportResult = "idle" | "ignored" | "captured" | "failed"

type SentrySdk = typeof import("@sentry/node")
type SentryIntegration = ReturnType<SentrySdk["getDefaultIntegrations"]>[number]

type ServerReporterInit = {
	readonly dsn: SentryDsn
	readonly tracesSampleRate: 0
	readonly enableRuntimeChannelInjection: false
	readonly integrations: (integrations: SentryIntegration[]) => SentryIntegration[]
}

// Http copies the request URL. Console copies console.log. Both can include reset-password/:token.
const SECRET_COPYING_INTEGRATION_NAMES = new Set(["Http", "Http.Server", "RequestData", "Console"])

function withoutSecretCopyingIntegrations(integrations: SentryIntegration[]): SentryIntegration[] {
	return integrations.filter(
		(integration) => !SECRET_COPYING_INTEGRATION_NAMES.has(integration.name),
	)
}

type RuntimeReporter =
	| { readonly state: "idle" }
	| { readonly state: "armed"; readonly dsn: SentryDsn; readonly sdk: SentrySdk }

const FLUSH_TIMEOUT_MS = 2000

let slot: Promise<ServerReporter> | undefined
let installed: RuntimeReporter | undefined

export function serverReporterFromEnv(env: ServerEnv): ServerReporterFromEnv {
	let dsn = env.SENTRY_DSN?.trim() ?? ""
	if (!isSentryDsn(dsn)) {
		return { state: "idle" }
	}
	return { state: "has-dsn", dsn }
}

function isSentryDsn(value: string): value is SentryDsn {
	return value.length > 0 && value === value.trim()
}

export function installServerReporter(env: ServerEnv): Promise<ServerReporter> {
	slot ??= installOnce(env)
	return slot
}

async function installOnce(env: ServerEnv): Promise<ServerReporter> {
	let parsed = serverReporterFromEnv(env)
	if (parsed.state === "idle") {
		installed = { state: "idle" }
		return parsed
	}

	try {
		let sdk = await import("@sentry/node")
		let initOptions: ServerReporterInit = {
			dsn: parsed.dsn,
			tracesSampleRate: 0,
			enableRuntimeChannelInjection: false,
			integrations: withoutSecretCopyingIntegrations,
		}
		// The SDK default is true, and that path patches `pg`. This process uses `pg`.
		sdk.init(initOptions)
		installed = { state: "armed", dsn: parsed.dsn, sdk }
		return { state: "armed", dsn: parsed.dsn }
	} catch (error) {
		console.error(error)
		installed = { state: "idle" }
		return { state: "idle" }
	}
}

function shouldReportRequestError(error: unknown, abortSignal?: AbortSignal): boolean {
	if (abortSignal?.aborted && error === abortSignal.reason) {
		return false
	}
	if (isAbortError(error)) {
		return false
	}
	let status = numericStatus(error)
	if (status != null && status >= 300 && status <= 499) {
		return false
	}
	return true
}

function isAbortError(error: unknown): boolean {
	return (
		typeof error === "object" && error !== null && "name" in error && error.name === "AbortError"
	)
}

function numericStatus(error: unknown): number | undefined {
	if (error instanceof Response) {
		return error.status
	}
	if (typeof error === "object" && error !== null && "status" in error) {
		let status = error.status
		if (typeof status === "number") {
			return status
		}
	}
	return undefined
}

export function reportRequestError(error: unknown, abortSignal?: AbortSignal): ReportResult {
	if (installed?.state !== "armed") {
		return "idle"
	}
	if (!shouldReportRequestError(error, abortSignal)) {
		return "ignored"
	}
	try {
		installed.sdk.captureException(error, {
			mechanism: { type: "remix-wordle.server", handled: false },
		})
		return "captured"
	} catch (thrown) {
		console.error(thrown)
		return "failed"
	}
}

export function flushServerReporter(): Promise<void> {
	if (installed?.state !== "armed") {
		return Promise.resolve()
	}
	let sdk = installed.sdk
	try {
		// NodeClient flushes on beforeExit. process.exit does not emit beforeExit.
		return Promise.resolve(sdk.flush(FLUSH_TIMEOUT_MS)).then(
			() => undefined,
			(error: unknown) => {
				console.error(error)
			},
		)
	} catch (error) {
		console.error(error)
		return Promise.resolve()
	}
}
