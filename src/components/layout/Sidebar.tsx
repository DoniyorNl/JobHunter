'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
	BarChart2,
	Briefcase,
	Calendar,
	FileText,
	LayoutDashboard,
	LogOut,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'

const NAV_ITEMS = [
	{ href: '/board', label: 'Job Board', icon: LayoutDashboard },
	{ href: '/resumes', label: 'Resumes', icon: FileText },
	{ href: '/contacts', label: 'Contacts', icon: Users },
	{ href: '/interviews', label: 'Interviews', icon: Calendar },
	{ href: '/metrics', label: 'Metrics', icon: BarChart2 },
] as const

interface SidebarProps {
	user: {
		name?: string | null
		email?: string | null
		avatarUrl?: string | null
	}
}

export function Sidebar({ user }: SidebarProps) {
	const pathname = usePathname()
	const router = useRouter()

	async function handleLogout() {
		const supabase = createClient()
		const { error } = await supabase.auth.signOut()

		if (error) {
			toast.error('Failed to sign out')
			return
		}

		router.push('/login')
		router.refresh()
	}

	const initials = user.name
		? user.name
				.split(' ')
				.map(n => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: (user.email?.[0]?.toUpperCase() ?? 'U')

	return (
		<aside className='w-60 shrink-0 flex flex-col h-full border-r bg-sidebar'>
			{/* Logo */}
			<div className='flex items-center gap-2.5 px-4 h-14 border-b'>
				<div className='w-7 h-7 bg-primary rounded-md flex items-center justify-center shrink-0'>
					<Briefcase className='w-4 h-4 text-primary-foreground' />
				</div>
				<span className='font-semibold text-foreground'>JobTracker</span>
			</div>

			{/* Navigation */}
			<nav className='flex-1 px-2 py-3 space-y-0.5 overflow-y-auto'>
				{NAV_ITEMS.map(({ href, label, icon: Icon }) => {
					const isActive = pathname.startsWith(href)

					return (
						<Link
							key={href}
							href={href}
							className={cn(
								'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
								isActive
									? 'bg-primary/10 text-primary'
									: 'text-muted-foreground hover:text-foreground hover:bg-accent',
							)}
						>
							<Icon className='w-4 h-4 shrink-0' />
							{label}
						</Link>
					)
				})}
			</nav>

			<Separator />

			{/* User info & logout */}
			<div className='p-3'>
				<div className='flex items-center gap-3 px-2 py-2 rounded-md'>
					<Avatar className='w-8 h-8 shrink-0'>
						<AvatarImage src={user.avatarUrl ?? undefined} />
						<AvatarFallback className='text-xs'>{initials}</AvatarFallback>
					</Avatar>
					<div className='flex-1 min-w-0'>
						<p className='text-sm font-medium text-foreground truncate'>{user.name ?? 'User'}</p>
						<p className='text-xs text-muted-foreground truncate'>{user.email}</p>
					</div>
				</div>

				<Button
					variant='ghost'
					size='sm'
					className='w-full justify-start gap-3 mt-1 text-muted-foreground hover:text-foreground'
					onClick={handleLogout}
				>
					<LogOut className='w-4 h-4' />
					Sign out
				</Button>
			</div>
		</aside>
	)
}
