/**
 * Parse JSON from a fetch Response; never throws on empty/non-JSON bodies.
 * Use after checking res.ok when you need error details from the body.
 */
export async function parseJsonSafe<T = unknown>(res: Response): Promise<T | null> {
	const text = await res.text()
	if (!text.trim()) return null
	try {
		return JSON.parse(text) as T
	} catch {
		return null
	}
}
