'use client'

import { useResumeStore } from '@/stores/resumeStore'
import { ClassicTemplate } from './ClassicTemplate'
import { MinimalTemplate } from './MinimalTemplate'
import { ModernTemplate } from './ModernTemplate'

/**
 * Container that renders the selected template based on the store.
 * Subscribes to resume store so it re-renders on every edit.
 *
 * Scales down the A4 document (794px wide) to fit the preview panel.
 * The `transform: scale()` approach preserves the exact look of the printed
 * document without re-implementing responsive styles.
 */
export function ResumePreview() {
	const data = useResumeStore(s => s.data)
	const template = useResumeStore(s => s.template)

	return (
		<div
			className='origin-top shadow-lg'
			style={{
				width: 794,
				transform: 'scale(0.72)',
				transformOrigin: 'top center',
				// Compensate layout space after CSS scale shrinks the element
				marginBottom: `calc((794px * 0.72 - 794px))`,
			}}
		>
			{template === 'classic' ? (
				<ClassicTemplate data={data} />
			) : template === 'minimal' ? (
				<MinimalTemplate data={data} />
			) : (
				<ModernTemplate data={data} />
			)}
		</div>
	)
}

/**
 * Full-size (unscaled) template renderer used for PDF export.
 * Exported separately so the export function can render at 1:1 scale
 * without affecting the preview panel.
 */
export function ResumeFullSize({ template, data }: {
	template: 'modern' | 'classic' | 'minimal'
	data: ReturnType<typeof useResumeStore.getState>['data']
}) {
	if (template === 'classic') return <ClassicTemplate data={data} />
	if (template === 'minimal') return <MinimalTemplate data={data} />
	return <ModernTemplate data={data} />
}
