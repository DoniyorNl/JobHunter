import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/types/api'
import { z } from 'zod'

const updateJobSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	company: z.string().min(1).max(200).optional(),
	location: z.string().max(200).nullable().optional(),
	salary: z.string().max(100).nullable().optional(),
	url: z.string().url().nullable().optional().or(z.literal('')),
	description: z.string().max(50_000).nullable().optional(),
	notes: z.string().max(10_000).nullable().optional(),
	status: z
		.enum(['WISHLIST', 'APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'])
		.optional(),
	position: z.number().int().min(0).optional(),
	color: z.string().max(20).nullable().optional(),
	appliedAt: z.string().datetime().nullable().optional(),
	deadlineAt: z.string().datetime().nullable().optional(),
	keywords: z.array(z.string()).optional(),
})

/**
 * Fetch the job and verify it belongs to this user in one query.
 * Using findFirst with both id + userId is safer than findUnique(id) + manual check —
 * it prevents any timing-window where another user could access the record.
 */
async function getOwnedJob(jobId: string, userId: string) {
	return prisma.job.findFirst({ where: { id: jobId, userId } })
}

/**
 * GET /api/jobs/[id]
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { user, response } = await requireUser()
	if (response) return response

	const { id } = await params
	const job = await getOwnedJob(id, user.id)
	if (!job) return errorResponse('Job not found', 404)

	return Response.json(successResponse(job))
}

/**
 * PATCH /api/jobs/[id] — partial update
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { user, response } = await requireUser()
	if (response) return response

	const { id } = await params
	const existing = await getOwnedJob(id, user.id)
	if (!existing) return errorResponse('Job not found', 404)

	const body = await req.json()
	const parsed = updateJobSchema.safeParse(body)
	if (!parsed.success) {
		return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)
	}

	const { url, appliedAt, deadlineAt, ...rest } = parsed.data

	const job = await prisma.job.update({
		where: { id },
		data: {
			...rest,
			// Only include date/url fields if they were sent — avoids accidental nulls
			...(url !== undefined ? { url: url || null } : {}),
			...(appliedAt !== undefined ? { appliedAt: appliedAt ? new Date(appliedAt) : null } : {}),
			...(deadlineAt !== undefined
				? { deadlineAt: deadlineAt ? new Date(deadlineAt) : null }
				: {}),
		},
	})

	return Response.json(successResponse(job))
}

/**
 * DELETE /api/jobs/[id]
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { user, response } = await requireUser()
	if (response) return response

	const { id } = await params
	const existing = await getOwnedJob(id, user.id)
	if (!existing) return errorResponse('Job not found', 404)

	await prisma.job.delete({ where: { id } })

	return new Response(null, { status: 204 })
}
