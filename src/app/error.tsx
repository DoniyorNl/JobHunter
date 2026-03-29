'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		console.error('[GlobalError]', error)
	}, [error])

	return (
		<div className='min-h-screen flex items-center justify-center bg-background'>
			<div className='text-center space-y-6 px-6 max-w-md'>
				<div className='w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto'>
					<svg xmlns='http://www.w3.org/2000/svg' className='w-8 h-8 text-destructive' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
						<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' />
					</svg>
				</div>
				<div className='space-y-2'>
					<h1 className='text-2xl font-bold tracking-tight'>Something went wrong</h1>
					<p className='text-muted-foreground text-sm'>
						An unexpected error occurred. Please try again or reload the page.
					</p>
					{error.digest && (
						<p className='text-xs text-muted-foreground font-mono'>Error ID: {error.digest}</p>
					)}
				</div>
				<div className='flex items-center justify-center gap-3'>
					<button
						onClick={reset}
						className='rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
					>
						Try again
					</button>
					<a
						href='/board'
						className='rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted'
					>
						Go home
					</a>
				</div>
			</div>
		</div>
	)
}
