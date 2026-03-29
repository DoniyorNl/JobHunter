'use client'

import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/uiStore'
import { Briefcase, Menu } from 'lucide-react'

/**
 * Shown only on mobile (lg:hidden).
 * Contains the hamburger button that toggles the sidebar Sheet.
 */
export function MobileTopBar() {
	const toggleSidebar = useUIStore(s => s.toggleSidebar)

	return (
		<header className='lg:hidden flex items-center gap-3 h-12 px-4 border-b bg-sidebar shrink-0'>
			<Button
				variant='ghost'
				size='icon'
				className='w-8 h-8'
				onClick={toggleSidebar}
				aria-label='Open navigation'
			>
				<Menu className='w-5 h-5' />
			</Button>

			<div className='flex items-center gap-2'>
				<div className='w-6 h-6 bg-primary rounded flex items-center justify-center'>
					<Briefcase className='w-3.5 h-3.5 text-primary-foreground' />
				</div>
				<span className='text-sm font-semibold'>JobTracker</span>
			</div>
		</header>
	)
}
