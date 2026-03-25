import { loadEnvFile } from "node:process"
import { defineConfig, env } from "prisma/config"

try {
	loadEnvFile(".env")
} catch {
	// ignore missing env file
}

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: env("DATABASE_URL"),
	},
})
