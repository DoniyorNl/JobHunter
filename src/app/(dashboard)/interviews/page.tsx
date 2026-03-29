import type { Metadata } from 'next'
import { QueryProvider } from '@/components/shared/QueryProvider'
import { InterviewsView } from '@/components/interviews/InterviewsView'

export const metadata: Metadata = { title: 'Interviews | JobTracker' }

export default function InterviewsPage() {
	return (
		<div className='flex flex-col h-full'>
			<div className='px-6 py-4 border-b'>
				<h1 className='text-xl font-semibold'>Interviews</h1>
				<p className='text-muted-foreground text-sm mt-0.5'>
					Schedule and track every interview stage, with notes and prep.
				</p>
			</div>
			<div className='flex-1 overflow-y-auto px-6 py-6'>
				<QueryProvider>
					<InterviewsView />
				</QueryProvider>
			</div>
		</div>
	)
}
