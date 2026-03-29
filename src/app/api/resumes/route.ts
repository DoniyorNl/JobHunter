import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/types/api'
import { EMPTY_RESUME_DATA } from '@/types/resume'
import type { Resume } from '@/types/resume'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'

const createResumeSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200),
	targetRole: z.string().max(200).optional(),
	template: z.enum(['modern', 'classic', 'minimal']).default('modern'),
	// Optional: when duplicating, pass the source resume's data to copy it
	sourceData: z.unknown().optional(),
})

/**
 * GET /api/resumes — list all resumes for the authenticated user
 */
export async function GET() {
	const { user, response } = await requireUser()
	if (response) return response

	const resumes = await prisma.resume.findMany({
		where: { userId: user.id },
		orderBy: [
			// Default resume first, then by most recently updated
			{ isDefault: 'desc' },
			{ updatedAt: 'desc' },
		],
	})

	return Response.json(successResponse(resumes as unknown as Resume[]))
}

/**
 * POST /api/resumes — create a new resume
 *
 * New resumes start with EMPTY_RESUME_DATA which the builder then populates.
 * If this is the user's first resume, it's automatically set as default.
 */
export async function POST(req: Request) {
	const { user, response } = await requireUser()
	if (response) return response

	let body: unknown
	try {
		body = await req.json()
	} catch {
		return errorResponse('Invalid JSON', 400)
	}

	const parsed = createResumeSchema.safeParse(body)
	if (!parsed.success) {
		return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)
	}

	// Auto-set as default if this is the first resume
	const existingCount = await prisma.resume.count({ where: { userId: user.id } })
	const isDefault = existingCount === 0

	const resumeData = parsed.data.sourceData ?? EMPTY_RESUME_DATA

	const resume = await prisma.resume.create({
		data: {
			userId: user.id,
			title: parsed.data.title,
			targetRole: parsed.data.targetRole ?? null,
			template: parsed.data.template,
			isDefault,
			data: resumeData as unknown as Prisma.InputJsonValue,
		},
	})

	return Response.json(successResponse(resume as unknown as Resume), { status: 201 })
}
