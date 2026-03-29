'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useResumeStore } from '@/stores/resumeStore'
import { cn } from '@/lib/utils'
import { Code2, Globe, Link, Loader2, Mail, MapPin, Phone, Sparkles, User } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function PersonalInfoSection() {
	const info = useResumeStore(s => s.data.personalInfo)
	const update = useResumeStore(s => s.updatePersonalInfo)

	return (
		<section>
			<SectionHeader title='Personal Info' />

			<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3'>
				<Field icon={<User />} label='Full name' className='sm:col-span-2'>
					<Input
						value={info.name}
						onChange={e => update({ name: e.target.value })}
						placeholder='John Doe'
					/>
				</Field>

				<Field icon={<Mail />} label='Email'>
					<Input
						type='email'
						value={info.email}
						onChange={e => update({ email: e.target.value })}
						placeholder='john@example.com'
					/>
				</Field>

				<Field icon={<Phone />} label='Phone'>
					<Input
						value={info.phone ?? ''}
						onChange={e => update({ phone: e.target.value })}
						placeholder='+1 (555) 000-0000'
					/>
				</Field>

				<Field icon={<MapPin />} label='Location'>
					<Input
						value={info.location ?? ''}
						onChange={e => update({ location: e.target.value })}
						placeholder='San Francisco, CA'
					/>
				</Field>

				<Field icon={<Link />} label='LinkedIn'>
					<Input
						value={info.linkedin ?? ''}
						onChange={e => update({ linkedin: e.target.value })}
						placeholder='linkedin.com/in/johndoe'
					/>
				</Field>

				<Field icon={<Code2 />} label='GitHub'>
					<Input
						value={info.github ?? ''}
						onChange={e => update({ github: e.target.value })}
						placeholder='github.com/johndoe'
					/>
				</Field>

				<Field icon={<Globe />} label='Website'>
					<Input
						value={info.website ?? ''}
						onChange={e => update({ website: e.target.value })}
						placeholder='johndoe.com'
					/>
				</Field>

				<div className='sm:col-span-2'>
					<SummaryField />
				</div>
			</div>
		</section>
	)
}

// ─── Summary field with AI ────────────────────────────────────────────────────

function SummaryField() {
	const info = useResumeStore(s => s.data.personalInfo)
	const update = useResumeStore(s => s.updatePersonalInfo)
	const [aiOpen, setAiOpen] = useState(false)
	const [targetRole, setTargetRole] = useState('')
	const [experience, setExperience] = useState('')
	const [generating, setGenerating] = useState(false)

	async function handleGenerate() {
		if (!targetRole.trim()) {
			toast.error('Enter a target role')
			return
		}
		setGenerating(true)
		try {
			const res = await fetch('/api/ai/generate-summary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetRole, experience }),
			})
			const data = (await res.json()) as { summary?: string; error?: { message: string } }
			if (!res.ok) {
				toast.error(data.error?.message ?? 'AI failed')
				return
			}
			if (data.summary) {
				update({ summary: data.summary })
				setAiOpen(false)
				toast.success('Summary generated ✨')
			}
		} catch {
			toast.error('Network error — please try again')
		} finally {
			setGenerating(false)
		}
	}

	return (
		<div>
			<div className='flex items-center justify-between mb-1.5'>
				<Label className='text-xs text-muted-foreground'>Summary / Headline</Label>
				<Button
					type='button'
					variant={aiOpen ? 'default' : 'ghost'}
					size='sm'
					className={cn('h-6 text-xs gap-1 px-2', !aiOpen && 'text-muted-foreground hover:text-primary')}
					onClick={() => setAiOpen(o => !o)}
				>
					<Sparkles className='w-3 h-3' />
					Write with AI
				</Button>
			</div>

			<Textarea
				value={info.summary ?? ''}
				onChange={e => update({ summary: e.target.value })}
				placeholder='Brief professional summary or headline...'
				className='min-h-20 resize-none text-sm'
			/>

			{aiOpen && (
				<div className='mt-2 p-2.5 rounded-md border bg-muted/30 space-y-2'>
					<p className='text-xs text-muted-foreground font-medium'>✨ AI Summary Generator</p>
					<div>
						<Label className='text-xs text-muted-foreground'>Target role *</Label>
						<Input
							value={targetRole}
							onChange={e => setTargetRole(e.target.value)}
							placeholder='e.g. Senior Frontend Engineer'
							className='mt-1 h-8 text-sm'
							autoFocus
						/>
					</div>
					<div>
						<Label className='text-xs text-muted-foreground'>
							Experience context (optional)
						</Label>
						<Textarea
							value={experience}
							onChange={e => setExperience(e.target.value)}
							placeholder='e.g. 5 years React, led team of 4, built e-commerce platform with $2M revenue'
							className='mt-1 min-h-16 resize-none text-sm'
						/>
					</div>
					<div className='flex gap-2 justify-end'>
						<Button
							type='button'
							variant='ghost'
							size='sm'
							className='h-7 text-xs'
							onClick={() => setAiOpen(false)}
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
								<><Loader2 className='w-3 h-3 animate-spin' />Generating…</>
							) : (
								<><Sparkles className='w-3 h-3' />Generate</>
							)}
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}

// ─── Shared primitives ────────────────────────────────────────────────────────

export function SectionHeader({ title }: { title: string }) {
	return (
		<div className='flex items-center gap-2'>
			<h2 className='text-sm font-semibold text-foreground'>{title}</h2>
			<div className='flex-1 h-px bg-border' />
		</div>
	)
}

function Field({
	icon,
	label,
	children,
	className,
}: {
	icon?: React.ReactNode
	label: string
	children: React.ReactNode
	className?: string
}) {
	return (
		<div className={className}>
			<Label className='flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5'>
				{icon && <span className='[&>svg]:w-3 [&>svg]:h-3'>{icon}</span>}
				{label}
			</Label>
			{children}
		</div>
	)
}
