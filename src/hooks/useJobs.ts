import { useBoardStore } from '@/stores/boardStore'
import type { CreateJobInput, Job, UpdateJobInput } from '@/types/job'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const JOB_KEYS = {
	all: ['jobs'] as const,
	lists: () => [...JOB_KEYS.all, 'list'] as const,
	detail: (id: string) => [...JOB_KEYS.all, 'detail', id] as const,
}

async function fetchJobs(): Promise<Job[]> {
	const res = await fetch('/api/jobs')
	if (!res.ok) throw new Error('Failed to fetch jobs')
	const { data } = await res.json()
	return data
}

async function createJob(input: CreateJobInput): Promise<Job> {
	const res = await fetch('/api/jobs', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!res.ok) {
		const body = await res.json()
		throw new Error(body.error ?? 'Failed to create job')
	}
	const { data } = await res.json()
	return data
}

async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
	const res = await fetch(`/api/jobs/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!res.ok) {
		const body = await res.json()
		throw new Error(body.error ?? 'Failed to update job')
	}
	const { data } = await res.json()
	return data
}

async function deleteJob(id: string): Promise<void> {
	const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
	if (!res.ok) {
		const body = await res.json()
		throw new Error(body.error ?? 'Failed to delete job')
	}
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useJobs() {
	const setJobs = useBoardStore(s => s.setJobs)

	return useQuery({
		queryKey: JOB_KEYS.lists(),
		queryFn: async () => {
			const jobs = await fetchJobs()
			setJobs(jobs)
			return jobs
		},
		staleTime: 30_000,
	})
}

export function useCreateJob() {
	const queryClient = useQueryClient()
	const addJob = useBoardStore(s => s.addJob)

	return useMutation({
		mutationFn: createJob,
		onSuccess: job => {
			addJob(job) // Optimistic (already added by server response)
			queryClient.invalidateQueries({ queryKey: JOB_KEYS.lists() })
			toast.success('Job added to board')
		},
		onError: (err: Error) => {
			toast.error(err.message)
		},
	})
}

export function useUpdateJob() {
	const queryClient = useQueryClient()
	const updateJobStore = useBoardStore(s => s.updateJob)

	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: UpdateJobInput }) => updateJob(id, input),
		onMutate: async ({ id, input }) => {
			// Optimistic update
			updateJobStore(id, input as Partial<Job>)
		},
		onSuccess: updatedJob => {
			queryClient.setQueryData<Job[]>(
				JOB_KEYS.lists(),
				old => old?.map(j => (j.id === updatedJob.id ? updatedJob : j)) ?? [],
			)
		},
		onError: (err: Error) => {
			toast.error(err.message)
			queryClient.invalidateQueries({ queryKey: JOB_KEYS.lists() })
		},
	})
}

export function useDeleteJob() {
	const queryClient = useQueryClient()
	const removeJob = useBoardStore(s => s.removeJob)

	return useMutation({
		mutationFn: deleteJob,
		onMutate: async id => {
			removeJob(id) // Optimistic
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: JOB_KEYS.lists() })
			toast.success('Job removed')
		},
		onError: (err: Error) => {
			toast.error(err.message)
			queryClient.invalidateQueries({ queryKey: JOB_KEYS.lists() })
		},
	})
}
