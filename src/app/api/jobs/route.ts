import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/types/api'
import { z } from 'zod'

const createJobSchema = z.object({
	title: z.string().min(1).max(200),
	company: z.string().min(1).max(200),
	location: z.string().max(200).optional(),
	salary: z.string().max(100).optional(),
	url: z.string().url().optional().or(z.literal('')),
	description: z.string().max(50_000).optional(),
	notes: z.string().max(10_000).optional(),
	status: z
		.enum(['WISHLIST', 'APPLIED', 'PHONE_SCREEN', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'])
		.default('WISHLIST'),
})

/**
 * GET /api/jobs — list all jobs for the authenticated user
 */
export async function GET() {
	const { user, response } = await requireUser()
	if (response) return response

	try {
		const jobs = await prisma.job.findMany({
			where: { userId: user.id },
			orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
		})
		return Response.json(successResponse(jobs))
	} catch (err) {
		console.error('[GET /api/jobs]', err)
		return errorResponse('Failed to fetch jobs', 500)
	}
}

/**
 * POST /api/jobs — create a new job
 */
export async function POST(req: Request) {
	const { user, response } = await requireUser()
	if (response) return response

	const body = await req.json()
	const parsed = createJobSchema.safeParse(body)

	if (!parsed.success) {
		return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)
	}

	const { url, ...rest } = parsed.data

	// Compute next position in this status column so new cards appear at the bottom
	const maxPosition = await prisma.job.aggregate({
		where: { userId: user.id, status: parsed.data.status },
		_max: { position: true },
	})

	try {
		const job = await prisma.job.create({
			data: {
				...rest,
				url: url || null,
				userId: user.id,
				position: (maxPosition._max.position ?? -1) + 1,
			},
		})
		return Response.json(successResponse(job), { status: 201 })
	} catch (err) {
		console.error('[POST /api/jobs]', err)
		return errorResponse('Failed to create job', 500)
	}
}
