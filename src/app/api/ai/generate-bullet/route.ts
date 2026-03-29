import { requireUser } from '@/lib/auth'
import { getGeminiModel } from '@/lib/ai/gemini'
import { AI_PROMPTS } from '@/lib/ai/prompts'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { errorResponse } from '@/types/api'
import { z } from 'zod'

const schema = z.object({
	company: z.string().max(200).default(''),
	role: z.string().max(200).default(''),
	/** What the user actually did — free text, used as AI context */
	context: z.string().min(5, 'Please add at least a few words of context').max(1000),
})

/**
 * POST /api/ai/generate-bullet
 *
 * Generates a single strong resume bullet point using Gemini.
 * Rate limited to 10 requests/minute per user (when Upstash is configured).
 *
 * Why POST not GET?
 * The prompt contains user data (could be sensitive) — it should never appear
 * in server logs as a query string. POST body is not logged by default.
 */
export async function POST(req: Request) {
	const { user, response } = await requireUser()
	if (response) return response

	// Check rate limit before doing any work
	const { success } = await checkAIRateLimit(user.id)
	if (!success) {
		return errorResponse('Too many AI requests. Please wait a minute.', 429, 'RATE_LIMITED')
	}

	let body: unknown
	try {
		body = await req.json()
	} catch {
		return errorResponse('Invalid JSON', 400)
	}

	const parsed = schema.safeParse(body)
	if (!parsed.success) {
		return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)
	}

	const { company, role, context } = parsed.data

	try {
		const model = getGeminiModel()
		const prompt = AI_PROMPTS.GENERATE_BULLET(company, role, context)
		const result = await model.generateContent(prompt)
		const bullet = result.response.text().trim()

		return Response.json({ bullet })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'AI generation failed'

		// Surface API key issues clearly so they're easy to debug
		if (message.includes('GEMINI_API_KEY')) {
			return errorResponse('AI is not configured. Add GEMINI_API_KEY to .env', 503, 'AI_NOT_CONFIGURED')
		}

		return errorResponse('AI generation failed. Please try again.', 500)
	}
}
