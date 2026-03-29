import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let ratelimit: Ratelimit | null = null

function getRatelimit(): Ratelimit | null {
	if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
		// Rate limiting is optional — if Upstash is not configured, we skip it.
		// In production you should configure Upstash to prevent abuse.
		return null
	}

	if (!ratelimit) {
		ratelimit = new Ratelimit({
			redis: Redis.fromEnv(),
			limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 AI requests / minute / user
			analytics: true,
			prefix: 'jobhunter:ratelimit:ai',
		})
	}

	return ratelimit
}

/**
 * Returns { success: true } if the user is within rate limits (or if
 * rate limiting is not configured). Returns { success: false } when throttled.
 */
export async function checkAIRateLimit(userId: string): Promise<{ success: boolean }> {
	const limiter = getRatelimit()
	if (!limiter) return { success: true }
	return limiter.limit(userId)
}
