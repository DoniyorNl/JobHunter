import { parseJsonSafe } from '@/lib/fetch-json'
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
	const body = await parseJsonSafe<{ data?: Job[]; error?: string }>(res)
	if (!res.ok) {
		throw new Error(body?.error ?? `Failed to fetch jobs (${res.status})`)
	}
	if (!body || !('data' in body)) {
		throw new Error('Invalid response from server')
	}
	return body.data ?? []
}

async function createJob(input: CreateJobInput): Promise<Job> {
	const res = await fetch('/api/jobs', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!res.ok) {
		const body = await parseJsonSafe<{ error?: string }>(res)
		throw new Error(body?.error ?? `Failed to create job (${res.status})`)
	}
	const body = await parseJsonSafe<{ data: Job }>(res)
	if (!body?.data) throw new Error('Invalid response from server')
	return body.data
}

async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
	const res = await fetch(`/api/jobs/${id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!res.ok) {
		const body = await parseJsonSafe<{ error?: string }>(res)
		throw new Error(body?.error ?? `Failed to update job (${res.status})`)
	}
	const body = await parseJsonSafe<{ data: Job }>(res)
	if (!body?.data) throw new Error('Invalid response from server')
	return body.data
}

async function deleteJob(id: string): Promise<void> {
	const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
	if (!res.ok) {
		const body = await parseJsonSafe<{ error?: string }>(res)
		throw new Error(body?.error ?? `Failed to delete job (${res.status})`)
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
	const setJobsStore = useBoardStore(s => s.setJobs)

	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: UpdateJobInput }) => updateJob(id, input),

		onMutate: async ({ id, input }) => {
			// 1. Cancel any outgoing refetches so they don't overwrite our optimistic update
			await queryClient.cancelQueries({ queryKey: JOB_KEYS.lists() })

			// 2. Snapshot the current query cache (for rollback)
			const previousJobs = queryClient.getQueryData<Job[]>(JOB_KEYS.lists())

			// 3. Apply optimistic update to the store immediately
			updateJobStore(id, input as Partial<Job>)

			// 4. Return snapshot — available in onError as context.previousJobs
			return { previousJobs }
		},

		onSuccess: (updatedJob, { id }) => {
			// Replace the optimistic version with the server's response
			queryClient.setQueryData<Job[]>(
				JOB_KEYS.lists(),
				old => old?.map(j => (j.id === id ? updatedJob : j)) ?? [],
			)
			// Sync store with authoritative server data
			updateJobStore(id, updatedJob)
		},

		onError: (err: Error, _vars, context) => {
			// Roll back the store to the snapshot taken in onMutate
			if (context?.previousJobs) {
				setJobsStore(context.previousJobs)
				queryClient.setQueryData(JOB_KEYS.lists(), context.previousJobs)
			}
			toast.error(err.message)
		},
	})
}

export function useDeleteJob() {
	const queryClient = useQueryClient()
	const removeJob = useBoardStore(s => s.removeJob)
	const setJobsStore = useBoardStore(s => s.setJobs)

	return useMutation({
		mutationFn: deleteJob,

		onMutate: async id => {
			await queryClient.cancelQueries({ queryKey: JOB_KEYS.lists() })

			// Snapshot for rollback
			const previousJobs = queryClient.getQueryData<Job[]>(JOB_KEYS.lists())

			// Optimistically remove from store and cache
			removeJob(id)
			queryClient.setQueryData<Job[]>(JOB_KEYS.lists(), old => old?.filter(j => j.id !== id))

			return { previousJobs }
		},

		onSuccess: () => {
			// Invalidate to get fresh count from server
			queryClient.invalidateQueries({ queryKey: JOB_KEYS.lists() })
			toast.success('Job removed')
		},

		onError: (err: Error, _id, context) => {
			// Roll back — the card reappears on the board
			if (context?.previousJobs) {
				setJobsStore(context.previousJobs)
				queryClient.setQueryData(JOB_KEYS.lists(), context.previousJobs)
			}
			toast.error(err.message)
		},
	})
}
