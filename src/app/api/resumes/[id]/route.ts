import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/types/api'
import type { Resume } from '@/types/resume'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'

const updateResumeSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	targetRole: z.string().max(200).nullable().optional(),
	template: z.enum(['modern', 'classic', 'minimal']).optional(),
	isDefault: z.boolean().optional(),
	// data = full ResumeData JSON; validated as unknown and cast to Prisma's InputJsonValue
	data: z.unknown().optional(),
})

async function getOwnedResume(resumeId: string, userId: string) {
	return prisma.resume.findFirst({ where: { id: resumeId, userId } })
}

/**
 * GET /api/resumes/[id]
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { user, response } = await requireUser()
	if (response) return response

	const { id } = await params
	const resume = await getOwnedResume(id, user.id)
	if (!resume) return errorResponse('Resume not found', 404)

	return Response.json(successResponse(resume as unknown as Resume))
}

/**
 * PATCH /api/resumes/[id] — partial update (title, template, or full data save)
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { user, response } = await requireUser()
	if (response) return response

	const { id } = await params
	const existing = await getOwnedResume(id, user.id)
	if (!existing) return errorResponse('Resume not found', 404)

	let body: unknown
	try {
		body = await req.json()
	} catch {
		return errorResponse('Invalid JSON', 400)
	}

	const parsed = updateResumeSchema.safeParse(body)
	if (!parsed.success) {
		return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)
	}

	/*
	 * If setting this resume as default, unset all others first.
	 * Doing it in a transaction ensures consistency — no two defaults at once.
	 */
	const { data: resumeData, ...scalarFields } = parsed.data
	const prismaData = {
		...scalarFields,
		// Cast ResumeData JSON to Prisma's InputJsonValue
		...(resumeData !== undefined
			? { data: resumeData as unknown as Prisma.InputJsonValue }
			: {}),
	}

	if (parsed.data.isDefault === true) {
		await prisma.$transaction([
			prisma.resume.updateMany({
				where: { userId: user.id, id: { not: id } },
				data: { isDefault: false },
			}),
			prisma.resume.update({ where: { id }, data: prismaData }),
		])
	}

	const resume = await prisma.resume.update({
		where: { id },
		data: prismaData,
	})

	return Response.json(successResponse(resume as unknown as Resume))
}

/**
 * DELETE /api/resumes/[id]
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { user, response } = await requireUser()
	if (response) return response

	const { id } = await params
	const existing = await getOwnedResume(id, user.id)
	if (!existing) return errorResponse('Resume not found', 404)

	await prisma.resume.delete({ where: { id } })

	return new Response(null, { status: 204 })
}
