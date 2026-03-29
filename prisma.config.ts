import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/** CLI (migrate, introspect) — Supabase: prefer DIRECT_URL when set */
function databaseUrl(): string | undefined {
	return process.env['DIRECT_URL'] ?? process.env['DATABASE_URL']
}

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
	},
	datasource: {
		url: databaseUrl(),
	},
})
