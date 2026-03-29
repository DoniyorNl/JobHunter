import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Interviews | JobTracker' }

export default function InterviewsPage() {
	return (
		<div className='px-6 py-4'>
			<h1 className='text-xl font-semibold'>Interviews</h1>
			<p className='text-muted-foreground text-sm mt-1'>Coming in Phase 4</p>
		</div>
	)
}
