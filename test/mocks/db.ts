import { mock } from "remix/test"

type UserRecord = {
	id: string
	email: string
	username: string
	password: string
	createdAt: Date
	updatedAt: Date
}

type GameRecord = {
	id: string
	createdAt: Date
	updatedAt: Date
	userId: string
	word: string
	status: string
	guesses: Array<{ guess: string }>
}

const defaultUsers: Array<UserRecord> = [
	{
		id: "user-test",
		email: "testuser@example.com",
		username: "testuser",
		password: "hashed-mytestaccountpassword",
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		updatedAt: new Date("2026-01-01T00:00:00.000Z"),
	},
	{
		id: "user-customer",
		email: "customer@example.com",
		username: "customer",
		password: "hashed-password123",
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		updatedAt: new Date("2026-01-01T00:00:00.000Z"),
	},
]

let users: Array<UserRecord> = []
let games: Array<GameRecord> = []
let redisStore = new Map<string, string>()

function matchesWhere(record: Record<string, unknown>, where: Record<string, unknown> | undefined) {
	if (!where) return true
	return Object.entries(where).every(([key, expected]) => {
		let actual = record[key]
		if (expected && typeof expected === "object") {
			let range = expected as { gte?: Date; lte?: Date }
			if (range.gte instanceof Date && actual instanceof Date && actual < range.gte) return false
			if (range.lte instanceof Date && actual instanceof Date && actual > range.lte) return false
			if (range.gte instanceof Date || range.lte instanceof Date) return true
		}
		return actual === expected
	})
}

function applyOmit<T extends Record<string, unknown>>(
	record: T,
	omit: Record<string, boolean> | undefined,
): T {
	if (!omit) return { ...record }
	let copy = { ...record }
	for (let [key, drop] of Object.entries(omit)) {
		if (drop) delete copy[key]
	}
	return copy
}

function createMock<T extends (...args: Array<never>) => unknown>(impl: T) {
	return mock.fn(impl)
}

export const userDb = {
	findFirst: createMock(
		async (args: { where?: Record<string, unknown>; omit?: Record<string, boolean> } = {}) => {
			let user = users.find((row) => matchesWhere(row, args.where))
			return user ? applyOmit(user, args.omit) : null
		},
	),
	findUnique: createMock(
		async (args: { where?: Record<string, unknown>; omit?: Record<string, boolean> } = {}) => {
			let user = users.find((row) => matchesWhere(row, args.where))
			return user ? applyOmit(user, args.omit) : null
		},
	),
	create: createMock(async (args: { data: Omit<UserRecord, "id" | "createdAt" | "updatedAt"> }) => {
		let user: UserRecord = {
			id: `user-${users.length + 1}`,
			createdAt: new Date(),
			updatedAt: new Date(),
			...args.data,
		}
		users.push(user)
		return user
	}),
	count: createMock(async () => users.length),
}

export const gameDb = {
	findFirst: createMock(
		async (args: { where?: Record<string, unknown> } = {}) =>
			games.find((row) => matchesWhere(row, args.where)) ?? null,
	),
	findUnique: createMock(
		async (args: { where?: Record<string, unknown> } = {}) =>
			games.find((row) => matchesWhere(row, args.where)) ?? null,
	),
	findMany: createMock(async (args: { where?: Record<string, unknown> } = {}) =>
		games.filter((row) => matchesWhere(row, args.where)),
	),
	create: createMock(async (args: { data: { userId: string; word: string; status: string } }) => {
		let game: GameRecord = {
			id: `game-${games.length + 1}`,
			createdAt: new Date(),
			updatedAt: new Date(),
			userId: args.data.userId,
			word: args.data.word,
			status: args.data.status,
			guesses: [],
		}
		games.push(game)
		return game
	}),
	update: createMock(async (args: { where: { id: string }; data: Record<string, unknown> }) => {
		let game = games.find((row) => row.id === args.where.id)
		if (game) Object.assign(game, args.data)
		return game
	}),
}

export const redis = {
	get: createMock(async (key: string) => redisStore.get(key) ?? null),
	set: createMock(async (key: string, value: string) => {
		redisStore.set(key, String(value))
		return "OK"
	}),
	del: createMock(async (key: string) => {
		redisStore.delete(key)
		return 1
	}),
	setEx: createMock(async (key: string, _ttl: number, value: string) => {
		redisStore.set(key, String(value))
		return "OK"
	}),
	expire: createMock(async () => 1),
}

export const db = {
	user: userDb,
	game: gameDb,
	guess: {
		create: createMock(async () => ({})),
	},
}

const mocks = [
	userDb.findFirst,
	userDb.findUnique,
	userDb.create,
	userDb.count,
	gameDb.findFirst,
	gameDb.findUnique,
	gameDb.findMany,
	gameDb.create,
	gameDb.update,
	redis.get,
	redis.set,
	redis.del,
	redis.setEx,
	redis.expire,
	db.guess.create,
]

export function resetDbMocks() {
	users = defaultUsers.map((user) => ({ ...user }))
	games = []
	redisStore = new Map()
	for (let mocked of mocks) {
		mocked.mock.resetCalls()
		mocked.mock.restore()
	}
}

resetDbMocks()
