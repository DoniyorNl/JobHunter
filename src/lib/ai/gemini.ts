import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Returns a Gemini model instance.
 *
 * The check is done at call-time (not module-load time) so that:
 * 1. `next build` does not fail when GEMINI_API_KEY is absent from the build env
 * 2. Pages that don't use AI are not affected
 * 3. The error surfaces clearly at the API route level
 */
export function getGeminiModel(modelName = 'gemini-2.0-flash') {
	const apiKey = process.env.GEMINI_API_KEY
	if (!apiKey) {
		throw new Error('GEMINI_API_KEY environment variable is not set')
	}
	const genAI = new GoogleGenerativeAI(apiKey)
	return genAI.getGenerativeModel({ model: modelName })
}
