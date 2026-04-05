import { THEME_INIT_SCRIPT } from '@/lib/theme-config'

/**
 * Blocking theme boot — native HTML `<script>` only (lowercase).
 *
 * Do NOT use `next/script` `<Script>` here: that symbol must be imported from
 * `next/script`, and a stray capital `<Script>` in JSX causes
 * `ReferenceError: Script is not defined`.
 */
export function ThemeInitScript() {
	return (
		<script
			suppressHydrationWarning
			dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT.trim() }}
		/>
	)
}
