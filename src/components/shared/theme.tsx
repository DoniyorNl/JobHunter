'use client'

import { THEME_STORAGE_KEY } from '@/lib/theme-config'
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react'

/**
 * Custom theme layer — replaces `next-themes`.
 *
 * WHY: `next-themes` renders a real `<script>` via React.createElement inside a
 * client component. React 19 warns (and may error in dev) because scripts in
 * client trees are not executed the same way as in the document.
 *
 * HOW:
 * - Blocking init runs via `next/script` + `beforeInteractive` in `layout.tsx`
 *   (outside React’s client render tree).
 * - This provider only syncs React state ↔ localStorage ↔ `document.documentElement`.
 */

const STORAGE_KEY = THEME_STORAGE_KEY
const MEDIA = '(prefers-color-scheme: dark)'

export type ThemeName = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

export type ThemeContextValue = {
	/** Stored preference: light | dark | system */
	theme: ThemeName | undefined
	setTheme: (theme: string) => void
	/** Actual light/dark after resolving "system" */
	resolvedTheme: ResolvedTheme | undefined
	themes: string[]
	systemTheme: ResolvedTheme | undefined
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getSystemTheme(): ResolvedTheme {
	if (typeof window === 'undefined') return 'light'
	return window.matchMedia(MEDIA).matches ? 'dark' : 'light'
}

function applyDom(theme: ThemeName) {
	const resolved: ResolvedTheme = theme === 'system' ? getSystemTheme() : theme
	document.documentElement.classList.toggle('dark', resolved === 'dark')
	document.documentElement.style.colorScheme = resolved
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<ThemeName>('system')
	const [systemTheme, setSystemTheme] = useState<ResolvedTheme | undefined>(undefined)
	const [mounted, setMounted] = useState(false)

	const resolvedTheme: ResolvedTheme | undefined =
		theme === 'system' ? systemTheme : theme

	const setTheme = useCallback((value: string) => {
		const t = value as ThemeName
		if (t !== 'light' && t !== 'dark' && t !== 'system') return
		setThemeState(t)
		try {
			localStorage.setItem(STORAGE_KEY, t)
		} catch {
			/* private mode */
		}
		applyDom(t)
	}, [])

	useEffect(() => {
		setMounted(true)
		const sys = getSystemTheme()
		setSystemTheme(sys)

		let stored: ThemeName = 'system'
		try {
			const raw = localStorage.getItem(STORAGE_KEY) as ThemeName | null
			if (raw === 'light' || raw === 'dark' || raw === 'system') stored = raw
		} catch {
			/* */
		}
		setThemeState(stored)
		applyDom(stored)
	}, [])

	useEffect(() => {
		if (!mounted) return
		const mq = window.matchMedia(MEDIA)
		const onChange = () => {
			const sys = getSystemTheme()
			setSystemTheme(sys)
			if (theme === 'system') applyDom('system')
		}
		mq.addEventListener('change', onChange)
		return () => mq.removeEventListener('change', onChange)
	}, [mounted, theme])

	const value = useMemo<ThemeContextValue>(
		() => ({
			theme,
			setTheme,
			resolvedTheme,
			themes: ['light', 'dark', 'system'],
			systemTheme,
		}),
		[theme, setTheme, resolvedTheme, systemTheme],
	)

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Same shape as `next-themes` for drop-in replacement in Sidebar / Sonner */
export function useTheme(): ThemeContextValue {
	const ctx = useContext(ThemeContext)
	if (!ctx) {
		return {
			theme: undefined,
			setTheme: () => {},
			resolvedTheme: undefined,
			themes: [],
			systemTheme: undefined,
		}
	}
	return ctx
}
