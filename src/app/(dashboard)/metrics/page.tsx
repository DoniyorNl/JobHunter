import { QueryProvider } from '@/components/shared/QueryProvider'
import { MetricsDashboard } from '@/components/metrics/MetricsDashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Metrics | JobTracker' }

export default function MetricsPage() {
	return (
		<div className='flex flex-col h-full'>
			<div className='flex items-center justify-between px-6 py-4 border-b shrink-0'>
				<div>
					<h1 className='text-xl font-semibold text-foreground'>Metrics</h1>
					<p className='text-sm text-muted-foreground'>
						Track your job search performance
					</p>
				</div>
			</div>

			<div className='flex-1 overflow-y-auto px-6 py-6'>
				<QueryProvider>
					<MetricsDashboard />
				</QueryProvider>
			</div>
		</div>
	)
}
