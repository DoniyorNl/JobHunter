import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Will throw at runtime if env vars are missing — intentional for fast failure
let ratelimit: Ratelimit | null = null

function getRatelimit(): Ratelimit {
	if (!ratelimit) {
		if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
			throw new Error('Upstash Redis environment variables are required for rate limiting')
		}

		ratelimit = new Ratelimit({
			redis: Redis.fromEnv(),
			limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 AI requests per minute per user
			analytics: true,
			prefix: 'huntr:ratelimit:ai',
		})
	}

	return ratelimit
}

export async function checkAIRateLimit(userId: string) {
	const limiter = getRatelimit()
	return limiter.limit(userId)
}
