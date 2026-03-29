import Link from 'next/link'

export default function NotFound() {
	return (
		<div className='min-h-screen flex items-center justify-center bg-background'>
			<div className='text-center space-y-6 px-6 max-w-md'>
				<div className='space-y-2'>
					<p className='text-8xl font-black text-primary/20 select-none'>404</p>
					<h1 className='text-2xl font-bold tracking-tight'>Page not found</h1>
					<p className='text-muted-foreground text-sm'>
						The page you&apos;re looking for doesn&apos;t exist or has been moved.
					</p>
				</div>
				<Link
					href='/board'
					className='inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
				>
					Back to board
				</Link>
			</div>
		</div>
	)
}
