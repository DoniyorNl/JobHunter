import { requireUser } from '@/lib/auth'
import { getGeminiModel } from '@/lib/ai/gemini'
import { AI_PROMPTS } from '@/lib/ai/prompts'
import { parseJsonResponse } from '@/lib/ai/parser'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/types/api'
import type { Prisma } from '@prisma/client'
import type { ResumeData, Resume } from '@/types/resume'
import { EMPTY_RESUME_DATA } from '@/types/resume'
import { z } from 'zod'

const schema = z.object({
	/** Base64-encoded PDF content */
	pdfBase64: z.string().min(100, 'File appears to be empty'),
	/** Always "application/pdf" — validated here for safety */
	mimeType: z.literal('application/pdf'),
	title: z.string().min(1, 'Resume name is required').max(200),
	template: z.enum(['modern', 'classic', 'minimal']).default('modern'),
	targetRole: z.string().max(200).optional(),
})

/**
 * POST /api/ai/parse-resume
 *
 * Accepts a base64-encoded PDF, sends it to Gemini via multimodal input,
 * parses the structured resume data, and saves a new Resume record.
 *
 * Why multimodal?
 * Gemini 2.0 Flash can natively read PDFs — no server-side PDF parsing
 * library needed. The model sees layout, tables, and formatting, which
 * makes extraction more accurate than plain text pipelines.
 */
export async function POST(req: Request) {
	const { user, response } = await requireUser()
	if (response) return response

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

	const { pdfBase64, mimeType, title, template, targetRole } = parsed.data

	let resumeData: ResumeData = EMPTY_RESUME_DATA

	try {
		const model = getGeminiModel()

		// Gemini multimodal — send PDF bytes directly alongside the text prompt
		const result = await model.generateContent([
			{
				inlineData: {
					mimeType,
					data: pdfBase64,
				},
			},
			AI_PROMPTS.PARSE_RESUME_PDF(),
		])

		const text = result.response.text()
		const extracted = parseJsonResponse<ResumeData>(text)

		// Sanity-check: ensure at minimum personalInfo exists
		if (extracted && typeof extracted === 'object' && 'personalInfo' in extracted) {
			resumeData = extracted
		}
	} catch (err) {
		console.error('[POST /api/ai/parse-resume] AI error:', err)
		// Don't fail the whole request — save with empty data and let user fill it in
		// This is a graceful degradation: user gets a resume they can still edit.
	}

	// Auto-set as default if this is the first resume
	const existingCount = await prisma.resume.count({ where: { userId: user.id } })
	const isDefault = existingCount === 0

	const resume = await prisma.resume.create({
		data: {
			userId: user.id,
			title,
			targetRole: targetRole ?? null,
			template,
			isDefault,
			data: resumeData as unknown as Prisma.InputJsonValue,
		},
	})

	return Response.json(successResponse(resume as unknown as Resume), { status: 201 })
}
