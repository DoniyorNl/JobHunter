'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDeleteJob } from '@/hooks/useJobs'
import { cn } from '@/lib/utils'
import { useBoardStore } from '@/stores/boardStore'
import type { Job } from '@/types/job'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatDistanceToNow } from 'date-fns'
import { Clock, DollarSign, ExternalLink, MapPin, MoreHorizontal } from 'lucide-react'

interface JobCardProps {
	job: Job
}

function CompanyLogo({ company }: { company: string }) {
	const domain = company
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.concat('.com')

	return (
		// eslint-disable-next-line @next/next/no-img-element
		<img
			src={`https://logo.clearbit.com/${domain}`}
			alt={`${company} logo`}
			className='w-8 h-8 rounded-md object-contain bg-white border'
			onError={e => {
				const target = e.currentTarget
				target.style.display = 'none'
				target.nextElementSibling?.classList.remove('hidden')
			}}
		/>
	)
}

export function JobCard({ job }: JobCardProps) {
	const selectJob = useBoardStore(s => s.selectJob)
	const deleteJob = useDeleteJob()

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: job.id,
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	const timeAgo = formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				'group bg-card border rounded-lg p-3 cursor-pointer select-none',
				'hover:border-primary/40 hover:shadow-sm transition-all',
				isDragging && 'opacity-50 shadow-lg rotate-1 scale-105',
			)}
			onClick={() => selectJob(job.id)}
			{...attributes}
			{...listeners}
		>
			{/* Header */}
			<div className='flex items-start justify-between gap-2 mb-2'>
				<div className='flex items-center gap-2 min-w-0'>
					<CompanyLogo company={job.company} />
					<div className='w-8 h-8 rounded-md bg-muted items-center justify-center text-xs font-bold uppercase hidden'>
						{job.company.slice(0, 2)}
					</div>
					<div className='min-w-0'>
						<p className='text-sm font-semibold text-foreground truncate leading-tight'>
							{job.title}
						</p>
						<p className='text-xs text-muted-foreground truncate'>{job.company}</p>
					</div>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger
						render={props => (
							<Button
								{...props}
								variant='ghost'
								size='icon'
								className={cn(
									'w-6 h-6 shrink-0 rounded-sm opacity-0 group-hover:opacity-100',
									props.className,
								)}
								onClick={e => {
									e.stopPropagation()
									props.onClick?.(e)
								}}
							>
								<MoreHorizontal className='w-3.5 h-3.5' />
							</Button>
						)}
					/>
					<DropdownMenuContent align='end' className='w-40'>
						<DropdownMenuItem
							onClick={e => {
								e.stopPropagation()
								selectJob(job.id)
							}}
						>
							View details
						</DropdownMenuItem>
						{job.url && (
							<DropdownMenuItem
								onClick={e => {
									e.stopPropagation()
									window.open(job.url!, '_blank', 'noopener,noreferrer')
								}}
							>
								<ExternalLink className='w-3.5 h-3.5 mr-2' />
								Open posting
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className='text-destructive'
							onClick={e => {
								e.stopPropagation()
								deleteJob.mutate(job.id)
							}}
						>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Meta */}
			<div className='space-y-1'>
				{job.location && (
					<div className='flex items-center gap-1 text-xs text-muted-foreground'>
						<MapPin className='w-3 h-3 shrink-0' />
						<span className='truncate'>{job.location}</span>
					</div>
				)}
				{job.salary && (
					<div className='flex items-center gap-1 text-xs text-muted-foreground'>
						<DollarSign className='w-3 h-3 shrink-0' />
						<span className='truncate'>{job.salary}</span>
					</div>
				)}
			</div>

			{/* Footer */}
			<div className='flex items-center justify-between mt-2 pt-2 border-t'>
				<span className='text-xs text-muted-foreground flex items-center gap-1'>
					<Clock className='w-3 h-3' />
					{timeAgo}
				</span>
				{job.deadlineAt && (
					<Badge variant='outline' className='text-xs px-1.5 py-0'>
						Due {formatDistanceToNow(new Date(job.deadlineAt), { addSuffix: true })}
					</Badge>
				)}
			</div>
		</div>
	)
}
