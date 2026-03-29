'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useResumeStore } from '@/stores/resumeStore'
import type { WorkExperience } from '@/types/resume'
import { cn } from '@/lib/utils'
import {
	Briefcase,
	ChevronDown,
	ChevronUp,
	Loader2,
	Minus,
	Plus,
	Sparkles,
	Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { SectionHeader } from './PersonalInfoSection'

export function ExperienceSection() {
	const experiences = useResumeStore(s => s.data.experience)
	const addExperience = useResumeStore(s => s.addExperience)

	return (
		<section>
			<SectionHeader title='Experience' />

			<div className='mt-3 space-y-3'>
				{experiences.map(exp => (
					<ExperienceCard key={exp.id} exp={exp} />
				))}

				<Button
					type='button'
					variant='outline'
					size='sm'
					className='w-full gap-2 border-dashed h-9'
					onClick={addExperience}
				>
					<Plus className='w-3.5 h-3.5' />
					Add experience
				</Button>
			</div>
		</section>
	)
}

// ─── Experience card ──────────────────────────────────────────────────────────

function ExperienceCard({ exp }: { exp: WorkExperience }) {
	const [collapsed, setCollapsed] = useState(false)
	const update = useResumeStore(s => s.updateExperience)
	const remove = useResumeStore(s => s.removeExperience)
	const addBullet = useResumeStore(s => s.addBullet)
	const updateBullet = useResumeStore(s => s.updateBullet)
	const removeBullet = useResumeStore(s => s.removeBullet)

	const headerLabel =
		exp.title || exp.company
			? `${exp.title || 'Untitled'} at ${exp.company || '?'}`
			: 'New experience'

	return (
		<div className='border rounded-lg overflow-hidden'>
			{/* Collapse toggle */}
			<div
				className='flex items-center gap-2 px-3 py-2.5 bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors'
				onClick={() => setCollapsed(c => !c)}
			>
				<Briefcase className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
				<span className='flex-1 text-sm font-medium text-foreground truncate'>{headerLabel}</span>
				{collapsed ? (
					<ChevronDown className='w-3.5 h-3.5 text-muted-foreground' />
				) : (
					<ChevronUp className='w-3.5 h-3.5 text-muted-foreground' />
				)}
			</div>

			{!collapsed && (
				<div className='px-3 py-3 space-y-3'>
					{/* Fields grid */}
					<div className='grid grid-cols-2 gap-2'>
						<div>
							<Label className='text-xs text-muted-foreground'>Job title</Label>
							<Input
								value={exp.title}
								onChange={e => update(exp.id, { title: e.target.value })}
								placeholder='Software Engineer'
								className='mt-1 h-8 text-sm'
							/>
						</div>
						<div>
							<Label className='text-xs text-muted-foreground'>Company</Label>
							<Input
								value={exp.company}
								onChange={e => update(exp.id, { company: e.target.value })}
								placeholder='Acme Corp'
								className='mt-1 h-8 text-sm'
							/>
						</div>
						<div>
							<Label className='text-xs text-muted-foreground'>Start date</Label>
							<Input
								value={exp.startDate}
								onChange={e => update(exp.id, { startDate: e.target.value })}
								placeholder='Jan 2022'
								className='mt-1 h-8 text-sm'
							/>
						</div>
						<div>
							<Label className='text-xs text-muted-foreground'>End date</Label>
							<Input
								value={exp.current ? 'Present' : (exp.endDate ?? '')}
								onChange={e => update(exp.id, { endDate: e.target.value, current: false })}
								placeholder='Dec 2024 or Present'
								disabled={exp.current}
								className='mt-1 h-8 text-sm'
							/>
						</div>
						<div className='col-span-2'>
							<Label className='text-xs text-muted-foreground'>Location (optional)</Label>
							<Input
								value={exp.location ?? ''}
								onChange={e => update(exp.id, { location: e.target.value })}
								placeholder='San Francisco, CA · Remote'
								className='mt-1 h-8 text-sm'
							/>
						</div>
					</div>

					{/* Current job checkbox */}
					<label className='flex items-center gap-2 cursor-pointer'>
						<input
							type='checkbox'
							checked={exp.current}
							onChange={e =>
								update(exp.id, { current: e.target.checked, endDate: undefined })
							}
							className='rounded border-border'
						/>
						<span className='text-xs text-muted-foreground'>I currently work here</span>
					</label>

					{/* Bullets */}
					<div className='space-y-2'>
						<Label className='text-xs text-muted-foreground'>Bullet points</Label>
						{exp.bullets.map((bullet, i) => (
							<BulletRow
								key={i}
								bullet={bullet}
								index={i}
								exp={exp}
								onUpdate={text => updateBullet(exp.id, i, text)}
								onRemove={() => removeBullet(exp.id, i)}
								canRemove={exp.bullets.length > 1}
							/>
						))}
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className='h-7 text-xs gap-1.5 text-muted-foreground'
							onClick={() => addBullet(exp.id)}
						>
							<Plus className='w-3 h-3' />
							Add bullet
						</Button>
					</div>

					{/* Delete experience */}
					<div className='flex justify-end pt-1 border-t'>
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className='h-7 text-xs gap-1.5 text-muted-foreground hover:text-destructive'
							onClick={() => remove(exp.id)}
						>
							<Trash2 className='w-3 h-3' />
							Remove
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}

// ─── Bullet row with AI generator ────────────────────────────────────────────

/**
 * Each bullet has:
 * - A textarea for the text
 * - A ✨ button that expands an inline AI context input
 *
 * Why inline expand instead of a modal?
 * The context is position-sensitive (user is looking at the bullet they want
 * to improve). An inline panel keeps the eye on the relevant bullet without
 * a context-switching modal overlay.
 */
function BulletRow({
	bullet,
	index,
	exp,
	onUpdate,
	onRemove,
	canRemove,
}: {
	bullet: string
	index: number
	exp: WorkExperience
	onUpdate: (text: string) => void
	onRemove: () => void
	canRemove: boolean
}) {
	const [aiOpen, setAiOpen] = useState(false)
	const [context, setContext] = useState('')
	const [generating, setGenerating] = useState(false)

	async function handleGenerate() {
		if (!context.trim() && !bullet.trim()) {
			toast.error('Add some context or an existing bullet to improve')
			return
		}

		setGenerating(true)
		try {
			const res = await fetch('/api/ai/generate-bullet', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					company: exp.company,
					role: exp.title,
					// If user typed context, use it. Otherwise improve the existing bullet.
					context: context.trim() || `Improve this bullet: ${bullet}`,
				}),
			})

			const data = (await res.json()) as { bullet?: string; error?: { message: string } }

			if (!res.ok) {
				toast.error(data.error?.message ?? 'AI generation failed')
				return
			}

			if (data.bullet) {
				onUpdate(data.bullet)
				setAiOpen(false)
				setContext('')
				toast.success('Bullet generated ✨')
			}
		} catch {
			toast.error('Network error — please try again')
		} finally {
			setGenerating(false)
		}
	}

	return (
		<div className='space-y-1.5'>
			{/* Bullet text row */}
			<div className='flex gap-2 items-start'>
				<span className='mt-2 text-muted-foreground shrink-0 text-sm'>•</span>
				<textarea
					value={bullet}
					onChange={e => onUpdate(e.target.value)}
					placeholder='Describe an achievement with impact (%, $, numbers)...'
					rows={2}
					className={cn(
						'flex-1 text-sm rounded-md border border-input bg-transparent px-2.5 py-1.5',
						'outline-none resize-none transition-colors',
						'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
						'field-sizing-content min-h-9',
					)}
				/>
				{/* AI button */}
				<Button
					type='button'
					variant={aiOpen ? 'default' : 'ghost'}
					size='icon'
					className={cn(
						'w-7 h-7 shrink-0 mt-0.5',
						!aiOpen && 'text-muted-foreground hover:text-primary',
					)}
					onClick={() => setAiOpen(o => !o)}
					title='Generate with AI'
				>
					<Sparkles className='w-3.5 h-3.5' />
				</Button>
				{canRemove && (
					<Button
						type='button'
						variant='ghost'
						size='icon'
						className='w-7 h-7 shrink-0 mt-0.5 text-muted-foreground hover:text-destructive'
						onClick={onRemove}
					>
						<Minus className='w-3 h-3' />
					</Button>
				)}
			</div>

			{/* AI context panel — inline expand */}
			{aiOpen && (
				<div className='ml-5 p-2.5 rounded-md border bg-muted/30 space-y-2'>
					<p className='text-xs text-muted-foreground font-medium'>
						✨ What did you do? (AI will write the bullet)
					</p>
					<textarea
						value={context}
						onChange={e => setContext(e.target.value)}
						placeholder={
							bullet
								? 'Leave blank to improve the existing bullet, or describe what you did...'
								: 'e.g. "Built a microservices API that reduced response time and handled 10k users"'
						}
						rows={2}
						autoFocus
						className={cn(
							'w-full text-sm rounded-md border border-input bg-background px-2.5 py-1.5',
							'outline-none resize-none placeholder:text-muted-foreground',
							'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
						)}
					/>
					<div className='flex gap-2 justify-end'>
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className='h-7 text-xs'
							onClick={() => {
								setAiOpen(false)
								setContext('')
							}}
						>
							Cancel
						</Button>
						<Button
							type='button'
							size='sm'
							className='h-7 text-xs gap-1.5'
							onClick={handleGenerate}
							disabled={generating}
						>
							{generating ? (
								<>
									<Loader2 className='w-3 h-3 animate-spin' />
									Generating…
								</>
							) : (
								<>
									<Sparkles className='w-3 h-3' />
									Generate
								</>
							)}
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
