import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Resumes | JobTracker' }

export default function ResumesPage() {
	return (
		<div className='px-6 py-4'>
			<h1 className='text-xl font-semibold'>Resumes</h1>
			<p className='text-muted-foreground text-sm mt-1'>Coming in Phase 2</p>
		</div>
	)
}
