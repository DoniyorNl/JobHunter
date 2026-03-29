'use client'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateResume } from '@/hooks/useResumes'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
	title: z.string().min(1, 'Title is required').max(200),
	targetRole: z.string().max(200).optional(),
	template: z.enum(['modern', 'classic', 'minimal']),
})

type FormValues = z.infer<typeof schema>

const TEMPLATES: {
	value: 'modern' | 'classic' | 'minimal'
	label: string
	description: string
	accent: string
}[] = [
	{
		value: 'modern',
		label: 'Modern',
		description: 'Clean layout with accent colors',
		accent: 'bg-blue-500',
	},
	{
		value: 'classic',
		label: 'Classic',
		description: 'Traditional single-column format',
		accent: 'bg-slate-700',
	},
	{
		value: 'minimal',
		label: 'Minimal',
		description: 'Ultra-clean, typography-focused',
		accent: 'bg-zinc-400',
	},
]

interface CreateResumeModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function CreateResumeModal({ open, onOpenChange }: CreateResumeModalProps) {
	const createResume = useCreateResume()
	const router = useRouter()

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { template: 'modern' },
	})

	async function onSubmit(data: FormValues) {
		const resume = await createResume.mutateAsync({
			title: data.title,
			targetRole: data.targetRole || undefined,
			template: data.template,
		})
		reset()
		onOpenChange(false)
		// Navigate to the resume builder
		router.push(`/resumes/${resume.id}`)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Create new resume</DialogTitle>
					<DialogDescription>
						Choose a template and give your resume a name to get started.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-5 py-2'>
					<div className='space-y-1.5'>
						<Label htmlFor='title'>Resume name</Label>
						<Input
							id='title'
							{...register('title')}
							placeholder='e.g. Software Engineer Resume'
							autoFocus
						/>
						{errors.title && (
							<p className='text-xs text-destructive'>{errors.title.message}</p>
						)}
					</div>

					<div className='space-y-1.5'>
						<Label htmlFor='targetRole'>
							Target role{' '}
							<span className='text-muted-foreground font-normal'>(optional)</span>
						</Label>
						<Input
							id='targetRole'
							{...register('targetRole')}
							placeholder='e.g. Senior Frontend Engineer'
						/>
					</div>

					<div className='space-y-2'>
						<Label>Template</Label>
						<Controller
							control={control}
							name='template'
							render={({ field }) => (
								<div className='grid grid-cols-3 gap-2'>
									{TEMPLATES.map(t => {
										const isSelected = field.value === t.value
										return (
											<button
												key={t.value}
												type='button'
												onClick={() => field.onChange(t.value)}
												className={cn(
													'relative flex flex-col gap-2 p-3 rounded-lg border-2 text-left transition-all',
													isSelected
														? 'border-primary bg-primary/5'
														: 'border-border hover:border-border/80 hover:bg-muted/50',
												)}
											>
												{/* Template preview strip */}
												<div className='space-y-1'>
													<div className={cn('h-1.5 w-3/4 rounded-full', t.accent)} />
													<div className='h-1 w-full rounded-full bg-muted-foreground/20' />
													<div className='h-1 w-5/6 rounded-full bg-muted-foreground/20' />
													<div className='h-1 w-2/3 rounded-full bg-muted-foreground/20' />
												</div>
												<div>
													<p className='text-xs font-semibold'>{t.label}</p>
													<p className='text-[10px] text-muted-foreground leading-tight'>
														{t.description}
													</p>
												</div>
												{isSelected && (
													<CheckCircle2 className='absolute top-2 right-2 w-3.5 h-3.5 text-primary' />
												)}
											</button>
										)
									})}
								</div>
							)}
						/>
					</div>

					<DialogFooter>
						<Button
							type='button'
							variant='ghost'
							onClick={() => onOpenChange(false)}
							disabled={createResume.isPending}
						>
							Cancel
						</Button>
						<Button type='submit' disabled={createResume.isPending}>
							{createResume.isPending ? 'Creating...' : 'Create resume'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
