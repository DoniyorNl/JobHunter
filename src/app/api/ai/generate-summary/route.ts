import { requireUser } from '@/lib/auth'
import { getGeminiModel } from '@/lib/ai/gemini'
import { AI_PROMPTS } from '@/lib/ai/prompts'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { errorResponse } from '@/types/api'
import { z } from 'zod'

const schema = z.object({
	targetRole: z.string().min(2, 'Target role is required').max(200),
	/** Brief description of experience — used as AI context */
	experience: z.string().min(10, 'Add some experience context').max(1000),
})

/**
 * POST /api/ai/generate-summary
 * Generates a professional resume summary / headline using Gemini.
 */
export async function POST(req: Request) {
	const { user, response } = await requireUser()
	if (response) return response

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

	const { targetRole, experience } = parsed.data

	try {
		const model = getGeminiModel()
		const prompt = AI_PROMPTS.GENERATE_SUMMARY(targetRole, experience)
		const result = await model.generateContent(prompt)
		const summary = result.response.text().trim()

		return Response.json({ summary })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'AI generation failed'

		if (message.includes('GEMINI_API_KEY')) {
			return errorResponse('AI is not configured. Add GEMINI_API_KEY to .env', 503, 'AI_NOT_CONFIGURED')
		}

		return errorResponse('AI generation failed. Please try again.', 500)
	}
}
