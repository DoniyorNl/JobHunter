import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
	throw new Error('GEMINI_API_KEY environment variable is required')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export function getGeminiModel(modelName = 'gemini-2.0-flash') {
	return genAI.getGenerativeModel({ model: modelName })
}

export { genAI }
