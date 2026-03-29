import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/types/api'
import { z } from 'zod'

const updateContactSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	title: z.string().max(200).optional(),
	company: z.string().max(200).optional(),
	email: z.string().email().optional().or(z.literal('')),
	phone: z.string().max(50).optional(),
	linkedin: z.string().max(500).optional(),
	notes: z.string().max(5000).optional(),
	jobId: z.string().nullable().optional(),
})

async function getOwnedContact(userId: string, id: string) {
	const contact = await prisma.contact.findUnique({ where: { id } })
	if (!contact || contact.userId !== userId) return null
	return contact
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { user, response } = await requireUser()
	if (response) return response

	const { id } = await params
	const contact = await getOwnedContact(user.id, id)
	if (!contact) return errorResponse('Not found', 404)

	let body: unknown
	try { body = await req.json() } catch { return errorResponse('Invalid JSON', 400) }

	const parsed = updateContactSchema.safeParse(body)
	if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)

	const updated = await prisma.contact.update({
		where: { id },
		data: {
			...parsed.data,
			email: parsed.data.email || null,
		},
		include: { job: { select: { id: true, title: true, company: true } } },
	})

	return Response.json(successResponse(updated))
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { user, response } = await requireUser()
	if (response) return response

	const { id } = await params
	const contact = await getOwnedContact(user.id, id)
	if (!contact) return errorResponse('Not found', 404)

	await prisma.contact.delete({ where: { id } })
	return Response.json(successResponse(null))
}
