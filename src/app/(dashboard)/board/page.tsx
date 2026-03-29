import { BoardView } from '@/components/board/BoardView'
import { QueryProvider } from '@/components/shared/QueryProvider'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Job Board | JobTracker',
}

export default function BoardPage() {
	return (
		<div className='flex flex-col h-full'>
			{/* Page header */}
			<div className='flex items-center justify-between px-6 py-4 border-b shrink-0'>
				<div>
					<h1 className='text-xl font-semibold text-foreground'>Job Board</h1>
					<p className='text-sm text-muted-foreground'>Drag cards to update status</p>
				</div>
			</div>

			{/* Board */}
			<div className='flex-1 overflow-hidden'>
				<QueryProvider>
					<BoardView />
				</QueryProvider>
			</div>
		</div>
	)
}
