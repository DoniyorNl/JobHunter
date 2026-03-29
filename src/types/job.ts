export type JobStatus =
	| 'WISHLIST'
	| 'APPLIED'
	| 'PHONE_SCREEN'
	| 'INTERVIEW'
	| 'OFFER'
	| 'REJECTED'
	| 'WITHDRAWN'

export interface Job {
	id: string
	userId: string
	title: string
	company: string
	location: string | null
	salary: string | null
	url: string | null
	description: string | null
	notes: string | null
	status: JobStatus
	position: number
	color: string | null
	appliedAt: Date | null
	deadlineAt: Date | null
	keywords: string[]
	createdAt: Date
	updatedAt: Date
}

export interface CreateJobInput {
	title: string
	company: string
	location?: string
	salary?: string
	url?: string
	description?: string
	notes?: string
	status?: JobStatus
}

export interface UpdateJobInput {
	title?: string
	company?: string
	location?: string
	salary?: string
	url?: string
	description?: string
	notes?: string
	status?: JobStatus
	position?: number
	color?: string
	appliedAt?: Date | null
	deadlineAt?: Date | null
	keywords?: string[]
}

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
	WISHLIST: 'Wishlist',
	APPLIED: 'Applied',
	PHONE_SCREEN: 'Phone Screen',
	INTERVIEW: 'Interview',
	OFFER: 'Offer',
	REJECTED: 'Rejected',
	WITHDRAWN: 'Withdrawn',
}

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
	WISHLIST: 'bg-slate-100 text-slate-700 border-slate-200',
	APPLIED: 'bg-blue-100 text-blue-700 border-blue-200',
	PHONE_SCREEN: 'bg-purple-100 text-purple-700 border-purple-200',
	INTERVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
	OFFER: 'bg-green-100 text-green-700 border-green-200',
	REJECTED: 'bg-red-100 text-red-700 border-red-200',
	WITHDRAWN: 'bg-gray-100 text-gray-500 border-gray-200',
}

export const BOARD_COLUMNS: JobStatus[] = [
	'WISHLIST',
	'APPLIED',
	'PHONE_SCREEN',
	'INTERVIEW',
	'OFFER',
	'REJECTED',
]
