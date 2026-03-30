import { requireUser } from '@/lib/auth'
import { getGeminiModel } from '@/lib/ai/gemini'
import { AI_PROMPTS } from '@/lib/ai/prompts'
import { parseJsonResponse } from '@/lib/ai/parser'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/types/api'
import type { ResumeData } from '@/types/resume'
import { z } from 'zod'

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
	resumeId: z.string().min(1, 'Resume ID is required'),
	jobTitle: z.string().min(1, 'Job title is required').max(200),
	company: z.string().min(1, 'Company is required').max(200),
	jobDescription: z.string().min(50, 'Job description is too short').max(10_000),
	/** If provided, save the result as a TailoredResume record */
	save: z.boolean().default(false),
	/** Optional linked job board entry */
	jobId: z.string().optional(),
})

// ─── Types ───────────────────────────────────────────────────────────────────

interface KeywordAnalysis {
	technicalSkills: string[]
	softSkills: string[]
	responsibilities: string[]
	qualifications: string[]
	matchScore: number
	missingKeywords: string[]
	matchedKeywords: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Flatten resume data into a plain text representation so AI can read it
 * without needing to understand our JSON schema.
 */
function resumeToText(data: ResumeData): string {
	const parts: string[] = []

	if (data.personalInfo.summary) parts.push(`SUMMARY\n${data.personalInfo.summary}`)

	if (data.experience.length > 0) {
		parts.push(
			'EXPERIENCE\n' +
				data.experience
					.map(
						e =>
							`${e.title} at ${e.company} (${e.startDate} – ${e.endDate ?? 'Present'})\n` +
							e.bullets.map(b => `• ${b}`).join('\n'),
					)
					.join('\n\n'),
		)
	}

	if (data.skills.length > 0) {
		parts.push(
			'SKILLS\n' +
				data.skills.map(g => `${g.category}: ${g.items.join(', ')}`).join('\n'),
		)
	}

	if (data.certifications && data.certifications.length > 0) {
		parts.push('CERTIFICATIONS\n' + data.certifications.map(c => c.name).join(', '))
	}

	return parts.join('\n\n')
}

/**
 * Apply tailored bullets back into a deep copy of the original resume data.
 * We only rewrite experience bullets — personal info, education, skills stay the same.
 */
function applyTailoredBullets(original: ResumeData, tailoredBulletsByExp: string[][]): ResumeData {
	return {
		...original,
		experience: original.experience.map((exp, i) => ({
			...exp,
			bullets: tailoredBulletsByExp[i] ?? exp.bullets,
		})),
	}
}

// ─── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/ai/tailor
 *
 * Two-step AI pipeline:
 * 1. EXTRACT_KEYWORDS prompt → keyword analysis + match score
 * 2. TAILOR_BULLETS prompt    → rewritten bullets for each experience entry
 *
 * Optionally persists the result as a TailoredResume record.
 */
export async function POST(req: Request) {
	const { user, response } = await requireUser()
	if (response) return response

	// Rate limit — same 10 req/min pool as other AI endpoints
	const { success } = await checkAIRateLimit(user.id)
	if (!success) return errorResponse('Rate limit exceeded — try again in a minute', 429)

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

	const { resumeId, jobTitle, company, jobDescription, save, jobId } = parsed.data

	// Verify the resume belongs to this user and load its data
	const resume = await prisma.resume.findFirst({
		where: { id: resumeId, userId: user.id },
	})
	if (!resume) return errorResponse('Resume not found', 404)

	const resumeData = resume.data as unknown as ResumeData
	const resumeText = resumeToText(resumeData)

	try {
		const model = getGeminiModel()

		// ── Step 1: Keyword extraction and match scoring ──────────────────────
		const [keywordResponse, ...bulletResponses] = await Promise.all([
			model.generateContent(AI_PROMPTS.EXTRACT_KEYWORDS(jobDescription, resumeText)),

			// ── Step 2: Tailor bullets for each experience entry (parallel) ───
			// Run each experience entry in parallel — one Gemini call per entry.
			// More precise than sending all bullets in one call.
			...resumeData.experience.map(exp =>
				model.generateContent(
					AI_PROMPTS.TAILOR_BULLETS(exp.bullets, jobDescription, jobTitle),
				),
			),
		])

		// Parse keyword analysis
		const keywordText = keywordResponse.response.text()
		const analysis = parseJsonResponse<KeywordAnalysis>(keywordText)

		// Parse tailored bullets (one array per experience entry)
		const tailoredBulletsByExp = bulletResponses.map(r => {
			try {
				return parseJsonResponse<string[]>(r.response.text())
			} catch {
				return [] // Fallback: keep originals for this entry if parsing fails
			}
		})

		// Build the tailored resume data
		const tailoredData = applyTailoredBullets(resumeData, tailoredBulletsByExp)

		// ── Optional: Persist the result ──────────────────────────────────────
		let savedRecord = null
		if (save) {
			savedRecord = await prisma.tailoredResume.create({
				data: {
					resumeId,
					jobId: jobId ?? null,
					jobTitle,
					company,
					jobDesc: jobDescription,
					matchScore: analysis.matchScore,
					data: tailoredData as unknown as Parameters<typeof prisma.tailoredResume.create>[0]['data']['data'],
				},
			})
		}

		return Response.json(
			successResponse({
				analysis,
				tailoredData,
				savedId: savedRecord?.id ?? null,
			}),
		)
	} catch (err) {
		console.error('[POST /api/ai/tailor]', err)
		return errorResponse('AI tailoring failed — check your Gemini API key', 500)
	}
}
