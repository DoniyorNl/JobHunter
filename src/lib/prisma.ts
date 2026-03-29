import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
	const connectionString = process.env.DATABASE_URL
	if (!connectionString) {
		throw new Error('DATABASE_URL is not set')
	}
	// Supabase Supavisor (pooler) uses a self-signed certificate chain.
	// rejectUnauthorized: false allows connecting without verifying the cert —
	// the connection is still encrypted; we simply skip chain validation.
	const adapter = new PrismaPg({
		connectionString,
		ssl: { rejectUnauthorized: false },
	})
	return new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
	})
}

function getClient(): PrismaClient {
	if (!globalForPrisma.prisma) {
		globalForPrisma.prisma = createClient()
	}
	return globalForPrisma.prisma
}

/** Lazily created so `next build` can load route modules before env is guaranteed in every worker. */
export const prisma = new Proxy({} as PrismaClient, {
	get(_target, prop, receiver) {
		const client = getClient()
		const value = Reflect.get(client, prop, receiver)
		return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(client) : value
	},
})

