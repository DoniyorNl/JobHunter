'use client'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateJob } from '@/hooks/useJobs'
import type { JobStatus } from '@/types/job'
import { BOARD_COLUMNS, JOB_STATUS_LABELS } from '@/types/job'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

const schema = z.object({
	title: z.string().min(1, 'Job title is required').max(200),
	company: z.string().min(1, 'Company is required').max(200),
	location: z.string().max(200).optional(),
	salary: z.string().max(100).optional(),
	url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
	description: z.string().max(50_000).optional(),
	notes: z.string().max(10_000).optional(),
	status: z.enum([
		'WISHLIST',
		'APPLIED',
		'PHONE_SCREEN',
		'INTERVIEW',
		'OFFER',
		'REJECTED',
		'WITHDRAWN',
	]),
})

type FormValues = z.infer<typeof schema>

interface AddJobModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	defaultStatus?: JobStatus
}

export function AddJobModal({ open, onOpenChange, defaultStatus = 'WISHLIST' }: AddJobModalProps) {
	const createJob = useCreateJob()

	const {
		control,
		register,
		handleSubmit,
		setValue,
		reset,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { status: defaultStatus },
	})

	const status = useWatch({ control, name: 'status' })

	async function onSubmit(values: FormValues) {
		await createJob.mutateAsync({
			...values,
			url: values.url || undefined,
		})
		reset()
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Add Job</DialogTitle>
					<DialogDescription>Track a new job opportunity</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-4 mt-2'>
					{/* Required fields */}
					<div className='grid grid-cols-2 gap-3'>
						<div className='space-y-1.5'>
							<Label htmlFor='title'>
								Job title <span className='text-destructive'>*</span>
							</Label>
							<Input id='title' placeholder='Senior Engineer' {...register('title')} />
							{errors.title && <p className='text-xs text-destructive'>{errors.title.message}</p>}
						</div>

						<div className='space-y-1.5'>
							<Label htmlFor='company'>
								Company <span className='text-destructive'>*</span>
							</Label>
							<Input id='company' placeholder='Acme Corp' {...register('company')} />
							{errors.company && (
								<p className='text-xs text-destructive'>{errors.company.message}</p>
							)}
						</div>
					</div>

					{/* Optional fields */}
					<div className='grid grid-cols-2 gap-3'>
						<div className='space-y-1.5'>
							<Label htmlFor='location'>Location</Label>
							<Input id='location' placeholder='Remote / NYC' {...register('location')} />
						</div>

						<div className='space-y-1.5'>
							<Label htmlFor='salary'>Salary</Label>
							<Input id='salary' placeholder='$120k–$160k' {...register('salary')} />
						</div>
					</div>

					<div className='space-y-1.5'>
						<Label htmlFor='url'>Job URL</Label>
						<Input id='url' type='url' placeholder='https://...' {...register('url')} />
						{errors.url && <p className='text-xs text-destructive'>{errors.url.message}</p>}
					</div>

					<div className='space-y-1.5'>
						<Label htmlFor='status'>Status</Label>
						<Select value={status} onValueChange={v => setValue('status', v as JobStatus)}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{BOARD_COLUMNS.map(s => (
									<SelectItem key={s} value={s}>
										{JOB_STATUS_LABELS[s]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className='space-y-1.5'>
						<Label htmlFor='notes'>Notes</Label>
						<Textarea
							id='notes'
							placeholder='Any notes about this role...'
							className='resize-none'
							rows={3}
							{...register('notes')}
						/>
					</div>

					<div className='flex justify-end gap-2 pt-2'>
						<Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button type='submit' disabled={createJob.isPending}>
							{createJob.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
							Add Job
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
