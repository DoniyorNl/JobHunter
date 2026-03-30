'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Wraps the app with next-themes.
 * - attribute="class" → applies "dark" class to <html>
 * - defaultTheme="system" → respects OS preference on first visit
 * - enableSystem → auto-detects prefers-color-scheme
 * - disableTransitionOnChange → prevents flash during theme switch
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
	return (
		<NextThemesProvider
			attribute='class'
			defaultTheme='system'
			enableSystem
			disableTransitionOnChange
		>
			{children}
		</NextThemesProvider>
	)
}
