import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Metrics | JobTracker' }

export default function MetricsPage() {
	return (
		<div className='px-6 py-4'>
			<h1 className='text-xl font-semibold'>Metrics</h1>
			<p className='text-muted-foreground text-sm mt-1'>Coming in Phase 4</p>
		</div>
	)
}
