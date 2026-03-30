import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/types/api'

/**
 * GET /api/resumes/[id]/tailored/[tailoredId]
 * Returns the full tailored resume including its data (for preview/export).
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string; tailoredId: string }> },
) {
	const { user, response } = await requireUser()
	if (response) return response

	const { id: resumeId, tailoredId } = await params

	// Join through resume to enforce ownership without an extra query
	const tailored = await prisma.tailoredResume.findFirst({
		where: { id: tailoredId, resumeId, resume: { userId: user.id } },
	})
	if (!tailored) return errorResponse('Not found', 404)

	return Response.json(successResponse(tailored))
}

/**
 * DELETE /api/resumes/[id]/tailored/[tailoredId]
 */
export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string; tailoredId: string }> },
) {
	const { user, response } = await requireUser()
	if (response) return response

	const { id: resumeId, tailoredId } = await params

	const tailored = await prisma.tailoredResume.findFirst({
		where: { id: tailoredId, resumeId, resume: { userId: user.id } },
	})
	if (!tailored) return errorResponse('Not found', 404)

	await prisma.tailoredResume.delete({ where: { id: tailoredId } })
	return Response.json(successResponse(null))
}
