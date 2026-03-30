import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendFollowUpReminder } from '@/lib/email'
import { errorResponse, successResponse } from '@/types/api'
import { z } from 'zod'
import { differenceInDays } from 'date-fns'

const schema = z.object({
	jobId: z.string().min(1, 'Job ID is required'),
})

/**
 * POST /api/reminders/send
 *
 * Sends a follow-up reminder email for a specific job.
 * The reminder is sent to the authenticated user's email.
 *
 * Design choice: we send on-demand (user-triggered) rather than
 * scheduling cron jobs, keeping the system simple and free-tier friendly.
 * Upstash QStash can be added later for automated scheduling.
 */
export async function POST(req: Request) {
	const { user, response } = await requireUser()
	if (response) return response

	let body: unknown
	try {
		body = await req.json()
	} catch {
		return errorResponse('Invalid JSON', 400)
	}

	const parsed = schema.safeParse(body)
	if (!parsed.success) {
		return errorResponse(parsed.error.issues[0]?.message ?? 'Validation failed', 400)
	}

	// Load the job and verify ownership in one query
	const job = await prisma.job.findFirst({
		where: { id: parsed.data.jobId, userId: user.id },
		select: { id: true, title: true, company: true, appliedAt: true, status: true },
	})
	if (!job) return errorResponse('Job not found', 404)

	// Only send reminders for jobs that are in APPLIED or PHONE_SCREEN state
	const reminderableStatuses = ['APPLIED', 'PHONE_SCREEN']
	if (!reminderableStatuses.includes(job.status)) {
		return errorResponse('Reminders are only available for Applied and Phone Screen jobs', 422)
	}

	const daysAgo = job.appliedAt
		? differenceInDays(new Date(), job.appliedAt)
		: 0

	try {
		await sendFollowUpReminder({
			to: user.email!,
			jobTitle: job.title,
			company: job.company,
			daysAgo,
		})
	} catch (err) {
		console.error('[POST /api/reminders/send]', err)
		return errorResponse('Failed to send email — check RESEND_API_KEY', 500)
	}

	return Response.json(successResponse({ sent: true, to: user.email }))
}
