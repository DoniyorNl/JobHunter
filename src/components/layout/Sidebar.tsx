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
	Moon,
	Settings,
	Sparkles,
	Sun,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'

const NAV_ITEMS = [
	{ href: '/board', label: 'Job Board', icon: LayoutDashboard, exact: false },
	{ href: '/resumes/tailor', label: 'Resume Tailor', icon: Sparkles, exact: true },
	{ href: '/resumes', label: 'Resumes', icon: FileText, exact: false },
	{ href: '/contacts', label: 'Contacts', icon: Users, exact: false },
	{ href: '/interviews', label: 'Interviews', icon: Calendar, exact: false },
	{ href: '/metrics', label: 'Metrics', icon: BarChart2, exact: false },
	{ href: '/settings', label: 'Settings', icon: Settings, exact: false },
] as const

interface SidebarProps {
	user: {
		name?: string | null
		email?: string | null
		avatarUrl?: string | null
	}
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────

function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme()
	const isDark = resolvedTheme === 'dark'

	return (
		<Button
			variant='ghost'
			size='sm'
			className='w-full justify-start gap-3 text-muted-foreground hover:text-foreground'
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
		>
			{isDark ? (
				<>
					<Sun className='w-4 h-4 shrink-0' />
					Light mode
				</>
			) : (
				<>
					<Moon className='w-4 h-4 shrink-0' />
					Dark mode
				</>
			)}
		</Button>
	)
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

	/*
	 * Why `mounted` state?
	 *
	 * Next.js App Router renders 'use client' components on the server for SSR.
	 * During that server pass, `usePathname()` may return a value that React
	 * can't guarantee will match the value at client hydration time — causing a
	 * className mismatch hydration warning.
	 *
	 * Solution: render ALL nav links as "inactive" on both the server AND the
	 * initial client render (before useEffect fires). Only after the component
	 * has mounted do we apply the real active state. The switch is instantaneous
	 * and invisible thanks to the existing `transition-colors` class.
	 */
	const [mounted, setMounted] = useState(false)
	useEffect(() => { setMounted(true) }, [])

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
				<span className='font-semibold tracking-tight text-foreground'>JobHunter</span>
			</div>

			{/* Navigation */}
			<nav className='flex-1 px-2 py-3 space-y-0.5 overflow-y-auto'>
		{NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
				// Only compute active state after mount to avoid SSR/client mismatch
				const exactSiblingActive = mounted && NAV_ITEMS.some(n => n.exact && pathname === n.href)
				const isActive = mounted && (exact
					? pathname === href
					: pathname.startsWith(href) && !exactSiblingActive)

				return (
					<Link
						key={href}
						href={href}
						onClick={onNavigate}
						className={cn(
							'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
							isActive
								? 'bg-foreground/[0.08] text-foreground'
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

			{/* Bottom controls — theme toggle + user */}
			<div className='p-3 shrink-0 space-y-1'>
				<ThemeToggle />

				<div className='flex items-center gap-3 px-2 py-2 rounded-md'>
					<Avatar className='w-8 h-8 shrink-0'>
						<AvatarImage src={user.avatarUrl ?? undefined} />
						<AvatarFallback className='text-xs font-medium'>{initials}</AvatarFallback>
					</Avatar>
					<div className='flex-1 min-w-0'>
						<p className='text-sm font-medium text-foreground truncate'>{user.name ?? 'User'}</p>
						<p className='text-xs text-muted-foreground truncate'>{user.email}</p>
					</div>
				</div>

				<Button
					variant='ghost'
					size='sm'
					className='w-full justify-start gap-3 text-muted-foreground hover:text-foreground'
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
 */
export function Sidebar({ user }: SidebarProps) {
	const sidebarOpen = useUIStore(s => s.sidebarOpen)
	const setSidebarOpen = useUIStore(s => s.setSidebarOpen)

	return (
		<>
			{/* Desktop sidebar */}
			<aside className='hidden lg:flex flex-col w-60 shrink-0 h-full border-r bg-sidebar'>
				<NavContent user={user} />
			</aside>

			{/* Mobile sidebar — Sheet drawer */}
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
