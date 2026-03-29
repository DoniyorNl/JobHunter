import { QueryProvider } from '@/components/shared/QueryProvider'
import { ResumeList } from '@/components/resume/ResumeList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Resumes | JobTracker' }

export default function ResumesPage() {
	return (
		<div className='flex flex-col h-full'>
			{/* Page header */}
			<div className='flex items-center justify-between px-6 py-4 border-b shrink-0'>
				<div>
					<h1 className='text-xl font-semibold text-foreground'>Resumes</h1>
					<p className='text-sm text-muted-foreground'>
						Build and tailor your resumes for each job
					</p>
				</div>
			</div>

			{/* Content */}
			<div className='flex-1 overflow-y-auto px-6 py-6'>
				<QueryProvider>
					<ResumeList />
				</QueryProvider>
			</div>
		</div>
	)
}
