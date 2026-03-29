import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
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

async function getAuthenticatedUser() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	return user
}

/**
 * GET /api/jobs — list all jobs for the authenticated user
 */
export async function GET() {
	const user = await getAuthenticatedUser()
	if (!user) return errorResponse('Unauthorized', 401)

	const jobs = await prisma.job.findMany({
		where: { userId: user.id },
		orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
	})

	return Response.json(successResponse(jobs))
}

/**
 * POST /api/jobs — create a new job
 */
export async function POST(req: Request) {
	const user = await getAuthenticatedUser()
	if (!user) return errorResponse('Unauthorized', 401)

	const body = await req.json()
	const parsed = createJobSchema.safeParse(body)

	if (!parsed.success) {
		return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)
	}

	const { url, ...rest } = parsed.data

	// Get the max position for this status column for ordering
	const maxPosition = await prisma.job.aggregate({
		where: { userId: user.id, status: parsed.data.status },
		_max: { position: true },
	})

	const job = await prisma.job.create({
		data: {
			...rest,
			url: url || null,
			userId: user.id,
			position: (maxPosition._max.position ?? -1) + 1,
		},
	})

	return Response.json(successResponse(job), { status: 201 })
}
