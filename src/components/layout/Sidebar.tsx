'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import {
	BarChart2,
	Briefcase,
	Calendar,
	FileText,
	LayoutDashboard,
	LogOut,
	Sparkles,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'

const NAV_ITEMS = [
	{ href: '/board', label: 'Job Board', icon: LayoutDashboard, exact: false },
	{ href: '/resumes/tailor', label: 'Resume Tailor', icon: Sparkles, exact: true },
	{ href: '/resumes', label: 'Resumes', icon: FileText, exact: false },
	{ href: '/contacts', label: 'Contacts', icon: Users, exact: false },
	{ href: '/interviews', label: 'Interviews', icon: Calendar, exact: false },
	{ href: '/metrics', label: 'Metrics', icon: BarChart2, exact: false },
] as const

interface SidebarProps {
	user: {
		name?: string | null
		email?: string | null
		avatarUrl?: string | null
	}
}

// ─── Shared nav content ────────────────────────────────────────────────────────

function NavContent({
	user,
	onNavigate,
}: {
	user: SidebarProps['user']
	onNavigate?: () => void
}) {
	const pathname = usePathname()
	const router = useRouter()

	const initials = user.name
		? user.name
				.split(' ')
				.map(n => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: (user.email?.[0]?.toUpperCase() ?? 'U')

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

	return (
		<>
			{/* Logo */}
			<div className='flex items-center gap-2.5 px-4 h-14 border-b shrink-0'>
				<div className='w-7 h-7 bg-primary rounded-md flex items-center justify-center shrink-0'>
					<Briefcase className='w-4 h-4 text-primary-foreground' />
				</div>
				<span className='font-semibold text-foreground'>JobTracker</span>
			</div>

			{/* Navigation */}
			<nav className='flex-1 px-2 py-3 space-y-0.5 overflow-y-auto'>
			{NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
				// exact=true → only highlight on exact match
				// exact=false → highlight on prefix match, BUT yield to any exact-match sibling
				const exactSiblingActive = NAV_ITEMS.some(n => n.exact && pathname === n.href)
				const isActive = exact
					? pathname === href
					: pathname.startsWith(href) && !exactSiblingActive

					return (
						<Link
							key={href}
							href={href}
							onClick={onNavigate}
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
			<div className='p-3 shrink-0'>
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
		</>
	)
}

// ─── Main Sidebar component ────────────────────────────────────────────────────

/**
 * Renders two variants:
 * 1. Desktop (lg+): fixed aside always visible
 * 2. Mobile (<lg): Sheet (drawer) controlled by useUIStore
 *
 * Nav content is extracted to NavContent to avoid duplication.
 */
export function Sidebar({ user }: SidebarProps) {
	const sidebarOpen = useUIStore(s => s.sidebarOpen)
	const setSidebarOpen = useUIStore(s => s.setSidebarOpen)

	return (
		<>
			{/* Desktop sidebar — hidden on mobile */}
			<aside className='hidden lg:flex flex-col w-60 shrink-0 h-full border-r bg-sidebar'>
				<NavContent user={user} />
			</aside>

			{/*
			 * Mobile sidebar — Sheet (drawer from left).
			 * Only rendered/interactive on small screens.
			 * Closing on nav click: onNavigate → setSidebarOpen(false)
			 */}
			<Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
				<SheetContent
					side='left'
					showCloseButton={false}
					className='w-60 p-0 flex flex-col gap-0'
				>
					<NavContent user={user} onNavigate={() => setSidebarOpen(false)} />
				</SheetContent>
			</Sheet>
		</>
	)
}
