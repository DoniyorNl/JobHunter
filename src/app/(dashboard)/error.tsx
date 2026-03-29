'use client'

import { useEffect } from 'react'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error('[DashboardError]', error)
	}, [error])

	return (
		<div className='flex flex-1 items-center justify-center p-8'>
			<div className='text-center space-y-4 max-w-sm'>
				<div className='w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto'>
					<svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 text-destructive' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' />
					</svg>
				</div>
				<div className='space-y-1'>
					<h2 className='text-base font-semibold'>Something went wrong</h2>
					<p className='text-sm text-muted-foreground'>
						This section failed to load. Your data is safe.
					</p>
				</div>
				<button
					onClick={reset}
					className='rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted'
				>
					Try again
				</button>
			</div>
		</div>
	)
}
