import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/types/api'
import { z } from 'zod'

const INTERVIEW_TYPES = ['PHONE_SCREEN', 'TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'TAKE_HOME', 'FINAL', 'OFFER_CALL'] as const

const updateInterviewSchema = z.object({
	type: z.enum(INTERVIEW_TYPES).optional(),
	scheduledAt: z.string().datetime().optional(),
	duration: z.number().int().min(5).max(480).nullable().optional(),
	location: z.string().max(500).optional(),
	notes: z.string().max(5000).optional(),
	feedback: z.string().max(10000).optional(),
})

async function getOwnedInterview(userId: string, id: string) {
	const interview = await prisma.interview.findUnique({ where: { id } })
	if (!interview || interview.userId !== userId) return null
	return interview
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { user, response } = await requireUser()
	if (response) return response

	const { id } = await params
	const interview = await getOwnedInterview(user.id, id)
	if (!interview) return errorResponse('Not found', 404)

	let body: unknown
	try { body = await req.json() } catch { return errorResponse('Invalid JSON', 400) }

	const parsed = updateInterviewSchema.safeParse(body)
	if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)

	const updated = await prisma.interview.update({
		where: { id },
		data: {
			...parsed.data,
			scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
		},
		include: { job: { select: { id: true, title: true, company: true } } },
	})

	return Response.json(successResponse(updated))
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { user, response } = await requireUser()
	if (response) return response

	const { id } = await params
	const interview = await getOwnedInterview(user.id, id)
	if (!interview) return errorResponse('Not found', 404)

	await prisma.interview.delete({ where: { id } })
	return Response.json(successResponse(null))
}
