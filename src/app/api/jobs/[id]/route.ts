import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
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

async function getAuthenticatedUser() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	return user
}

async function getJobOrFail(jobId: string, userId: string) {
	const job = await prisma.job.findFirst({
		where: { id: jobId, userId },
	})
	return job
}

/**
 * GET /api/jobs/[id] — get a single job
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const user = await getAuthenticatedUser()
	if (!user) return errorResponse('Unauthorized', 401)

	const { id } = await params
	const job = await getJobOrFail(id, user.id)

	if (!job) return errorResponse('Job not found', 404)

	return Response.json(successResponse(job))
}

/**
 * PATCH /api/jobs/[id] — update a job
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const user = await getAuthenticatedUser()
	if (!user) return errorResponse('Unauthorized', 401)

	const { id } = await params
	const existing = await getJobOrFail(id, user.id)
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
			...(url !== undefined ? { url: url || null } : {}),
			...(appliedAt !== undefined ? { appliedAt: appliedAt ? new Date(appliedAt) : null } : {}),
			...(deadlineAt !== undefined ? { deadlineAt: deadlineAt ? new Date(deadlineAt) : null } : {}),
		},
	})

	return Response.json(successResponse(job))
}

/**
 * DELETE /api/jobs/[id] — delete a job
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const user = await getAuthenticatedUser()
	if (!user) return errorResponse('Unauthorized', 401)

	const { id } = await params
	const existing = await getJobOrFail(id, user.id)
	if (!existing) return errorResponse('Job not found', 404)

	await prisma.job.delete({ where: { id } })

	return new Response(null, { status: 204 })
}
