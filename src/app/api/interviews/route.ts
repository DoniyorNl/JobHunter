import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/types/api'
import { z } from 'zod'

const INTERVIEW_TYPES = ['PHONE_SCREEN', 'TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'TAKE_HOME', 'FINAL', 'OFFER_CALL'] as const

const createInterviewSchema = z.object({
	jobId: z.string().min(1, 'Job is required'),
	type: z.enum(INTERVIEW_TYPES),
	scheduledAt: z.string().datetime(),
	duration: z.number().int().min(5).max(480).optional(),
	location: z.string().max(500).optional(),
	notes: z.string().max(5000).optional(),
})

export async function GET() {
	const { user, response } = await requireUser()
	if (response) return response

	const interviews = await prisma.interview.findMany({
		where: { userId: user.id },
		include: { job: { select: { id: true, title: true, company: true } } },
		orderBy: { scheduledAt: 'asc' },
	})

	return Response.json(successResponse(interviews))
}

export async function POST(req: Request) {
	const { user, response } = await requireUser()
	if (response) return response

	let body: unknown
	try { body = await req.json() } catch { return errorResponse('Invalid JSON', 400) }

	const parsed = createInterviewSchema.safeParse(body)
	if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)

	// Verify the job belongs to this user
	const job = await prisma.job.findFirst({ where: { id: parsed.data.jobId, userId: user.id } })
	if (!job) return errorResponse('Job not found', 404)

	const interview = await prisma.interview.create({
		data: {
			userId: user.id,
			jobId: parsed.data.jobId,
			type: parsed.data.type,
			scheduledAt: new Date(parsed.data.scheduledAt),
			duration: parsed.data.duration ?? null,
			location: parsed.data.location ?? null,
			notes: parsed.data.notes ?? null,
		},
		include: { job: { select: { id: true, title: true, company: true } } },
	})

	return Response.json(successResponse(interview), { status: 201 })
}
