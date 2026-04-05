import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { errorResponse, successResponse } from '@/types/api'
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns'

/**
 * GET /api/metrics — aggregate job search analytics for the dashboard.
 *
 * Why a dedicated endpoint instead of computing on the client?
 * - GROUP BY and COUNT queries are far more efficient in SQL than
 *   fetching all jobs and computing in JS.
 * - The metrics page doesn't need full job objects — only counts.
 * - Keeps the response small and fast.
 */
export async function GET() {
	const { user, response } = await requireUser()
	if (response) return response

	try {
	// Run all queries in parallel for minimal latency
	const [statusCounts, recentJobs, totalCount] = await Promise.all([
		// Status breakdown
		prisma.job.groupBy({
			by: ['status'],
			where: { userId: user.id },
			_count: { id: true },
		}),

		// Last 30 days — for the timeline chart
		prisma.job.findMany({
			where: {
				userId: user.id,
				createdAt: { gte: subDays(new Date(), 30) },
			},
			select: { createdAt: true, status: true },
			orderBy: { createdAt: 'asc' },
		}),

		// Total count
		prisma.job.count({ where: { userId: user.id } }),
	])

	// ── Status breakdown ───────────────────────────────────────────────────────
	const byStatus = statusCounts.reduce(
		(acc, row) => {
			acc[row.status] = row._count.id
			return acc
		},
		{} as Record<string, number>,
	)

	// ── KPI calculations ───────────────────────────────────────────────────────
	const applied = byStatus['APPLIED'] ?? 0
	const phoneScreen = byStatus['PHONE_SCREEN'] ?? 0
	const interview = byStatus['INTERVIEW'] ?? 0
	const offer = byStatus['OFFER'] ?? 0
	const rejected = byStatus['REJECTED'] ?? 0
	const withdrawn = byStatus['WITHDRAWN'] ?? 0
	const wishlist = byStatus['WISHLIST'] ?? 0

	// "Active" = everything that's not wishlist/rejected/withdrawn
	const activeApplications = applied + phoneScreen + interview + offer

	// Response rate = jobs that moved past "Applied" / total applied
	const responded = phoneScreen + interview + offer + rejected
	const responseRate = applied + responded > 0 ? Math.round((responded / (applied + responded)) * 100) : 0

	// Interview rate = interviews / responded
	const interviewRate =
		responded > 0 ? Math.round(((interview + offer) / responded) * 100) : 0

	// Offer rate = offers / interviews
	const offerRate =
		interview + offer > 0 ? Math.round((offer / (interview + offer)) * 100) : 0

	// ── Timeline: applications per day (last 30 days) ─────────────────────────
	const today = startOfDay(new Date())
	const thirtyDaysAgo = subDays(today, 29)

	const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today })
	const dayMap = new Map<string, number>()
	days.forEach(d => dayMap.set(format(d, 'MMM d'), 0))

	recentJobs.forEach(job => {
		const key = format(new Date(job.createdAt), 'MMM d')
		if (dayMap.has(key)) {
			dayMap.set(key, (dayMap.get(key) ?? 0) + 1)
		}
	})

	const timeline = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }))

	// ── Pipeline funnel ────────────────────────────────────────────────────────
	const pipeline = [
		{ stage: 'Applied', count: applied + phoneScreen + interview + offer + rejected + withdrawn },
		{ stage: 'Phone Screen', count: phoneScreen + interview + offer },
		{ stage: 'Interview', count: interview + offer },
		{ stage: 'Offer', count: offer },
	].filter(s => s.count > 0)

	return Response.json(
		successResponse({
			totals: {
				total: totalCount,
				wishlist,
				active: activeApplications,
				rejected,
				offer,
			},
			kpis: {
				responseRate,
				interviewRate,
				offerRate,
			},
			byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
			timeline,
			pipeline,
		}),
	)
	} catch (err) {
		console.error('[GET /api/metrics]', err)
		return errorResponse('Failed to fetch metrics', 500)
	}
}
