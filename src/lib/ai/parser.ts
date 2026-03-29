/**
 * Parses a JSON response from Gemini that may be wrapped in markdown code blocks.
 */
export function parseJsonResponse<T>(text: string): T {
	const cleaned = text
		.replace(/^```json\s*/i, '')
		.replace(/^```\s*/i, '')
		.replace(/```\s*$/i, '')
		.trim()

	return JSON.parse(cleaned) as T
}

/**
 * Calculates a keyword match score between a resume and a job description.
 * Returns a value between 0 and 100.
 */
export function calculateMatchScore(resumeKeywords: string[], jobKeywords: string[]): number {
	if (jobKeywords.length === 0) return 0

	const normalizedResume = resumeKeywords.map(k => k.toLowerCase())
	const normalizedJob = jobKeywords.map(k => k.toLowerCase())

	const matched = normalizedJob.filter(k => normalizedResume.includes(k))
	return Math.round((matched.length / normalizedJob.length) * 100)
}
