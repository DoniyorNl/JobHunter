import { ResumeBuilder } from '@/components/resume/builder/ResumeBuilder'
import { QueryProvider } from '@/components/shared/QueryProvider'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { Resume, ResumeData } from '@/types/resume'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Resume Builder | JobTracker' }

/**
 * Server Component — fetches resume directly from DB (no API round-trip).
 * Passes hydrated data to the client-side builder.
 *
 * We use Prisma directly here instead of fetch('/api/resumes/[id]') because:
 * 1. No serialization overhead — data goes straight from DB to RSC props
 * 2. We can verify ownership in one query
 * 3. No auth header cookie passing needed (server context has it)
 */
export default async function ResumeBuilderPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params

	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) redirect('/login')

	const dbResume = await prisma.resume.findFirst({
		where: { id, userId: user.id },
	})
	if (!dbResume) notFound()

	const resume: Resume = {
		id: dbResume.id,
		userId: dbResume.userId,
		title: dbResume.title,
		targetRole: dbResume.targetRole,
		template: dbResume.template as Resume['template'],
		isDefault: dbResume.isDefault,
		data: dbResume.data as unknown as ResumeData,
		createdAt: dbResume.createdAt,
		updatedAt: dbResume.updatedAt,
	}

	return (
		<div className='h-full flex flex-col'>
			{/*
			 * key={id} ensures ResumeBuilder fully remounts when navigating between
			 * different resumes — store is re-hydrated with fresh data.
			 */}
			<QueryProvider>
				<ResumeBuilder key={id} resume={resume} />
			</QueryProvider>
		</div>
	)
}
