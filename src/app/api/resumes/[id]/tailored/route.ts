import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/types/api'

/**
 * GET /api/resumes/[id]/tailored
 * Lists all tailored versions saved for a specific resume.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { user, response } = await requireUser()
	if (response) return response

	const { id: resumeId } = await params

	// Confirm ownership before listing child records
	const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId: user.id } })
	if (!resume) return errorResponse('Resume not found', 404)

	const tailored = await prisma.tailoredResume.findMany({
		where: { resumeId },
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			resumeId: true,
			jobId: true,
			jobTitle: true,
			company: true,
			matchScore: true,
			createdAt: true,
			// Omit jobDesc and data from the list — too large, loaded on demand
		},
	})

	return Response.json(successResponse(tailored))
}
