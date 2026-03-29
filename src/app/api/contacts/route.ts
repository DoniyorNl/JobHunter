import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/types/api'
import { z } from 'zod'

const createContactSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200),
	title: z.string().max(200).optional(),
	company: z.string().max(200).optional(),
	email: z.string().email('Invalid email').optional().or(z.literal('')),
	phone: z.string().max(50).optional(),
	linkedin: z.string().max(500).optional(),
	notes: z.string().max(5000).optional(),
	jobId: z.string().optional(),
})

export async function GET() {
	const { user, response } = await requireUser()
	if (response) return response

	const contacts = await prisma.contact.findMany({
		where: { userId: user.id },
		include: { job: { select: { id: true, title: true, company: true } } },
		orderBy: { createdAt: 'desc' },
	})

	return Response.json(successResponse(contacts))
}

export async function POST(req: Request) {
	const { user, response } = await requireUser()
	if (response) return response

	let body: unknown
	try { body = await req.json() } catch { return errorResponse('Invalid JSON', 400) }

	const parsed = createContactSchema.safeParse(body)
	if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)

	const contact = await prisma.contact.create({
		data: {
			userId: user.id,
			name: parsed.data.name,
			title: parsed.data.title ?? null,
			company: parsed.data.company ?? null,
			email: parsed.data.email || null,
			phone: parsed.data.phone ?? null,
			linkedin: parsed.data.linkedin ?? null,
			notes: parsed.data.notes ?? null,
			jobId: parsed.data.jobId ?? null,
		},
		include: { job: { select: { id: true, title: true, company: true } } },
	})

	return Response.json(successResponse(contact), { status: 201 })
}
