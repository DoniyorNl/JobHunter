'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
	Building2,
	ExternalLink,
	Link,
	Mail,
	MoreHorizontal,
	Phone,
	Plus,
	Trash2,
	UserRound,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Contact {
	id: string
	name: string
	title: string | null
	company: string | null
	email: string | null
	phone: string | null
	linkedin: string | null
	notes: string | null
	createdAt: string
	job: { id: string; title: string; company: string } | null
}

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchContacts(): Promise<Contact[]> {
	const res = await fetch('/api/contacts')
	if (!res.ok) throw new Error('Failed to fetch contacts')
	const { data } = await res.json()
	return data
}

async function createContact(input: Omit<Contact, 'id' | 'createdAt' | 'job'>): Promise<Contact> {
	const res = await fetch('/api/contacts', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(input),
	})
	if (!res.ok) { const b = await res.json(); throw new Error(b.error ?? 'Failed') }
	const { data } = await res.json()
	return data
}

async function deleteContact(id: string): Promise<void> {
	const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
	if (!res.ok) throw new Error('Failed to delete contact')
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

function useContacts() {
	return useQuery({ queryKey: ['contacts'], queryFn: fetchContacts, staleTime: 60_000 })
}

function useCreateContact() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: createContact,
		onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contact added') },
		onError: (e: Error) => toast.error(e.message),
	})
}

function useDeleteContact() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: deleteContact,
		onMutate: async (id) => {
			await qc.cancelQueries({ queryKey: ['contacts'] })
			const prev = qc.getQueryData<Contact[]>(['contacts'])
			qc.setQueryData<Contact[]>(['contacts'], old => old?.filter(c => c.id !== id))
			return { prev }
		},
		onSuccess: () => toast.success('Contact removed'),
		onError: (e: Error, _id, ctx) => {
			if (ctx?.prev) qc.setQueryData(['contacts'], ctx.prev)
			toast.error(e.message)
		},
	})
}

// ── Form schema ────────────────────────────────────────────────────────────────

const schema = z.object({
	name: z.string().min(1, 'Name is required').max(200),
	title: z.string().max(200).optional(),
	company: z.string().max(200).optional(),
	email: z.string().email('Invalid email').optional().or(z.literal('')),
	phone: z.string().max(50).optional(),
	linkedin: z.string().max(500).optional(),
	notes: z.string().max(5000).optional(),
})
type FormValues = z.infer<typeof schema>

// ── Main view ─────────────────────────────────────────────────────────────────

export function ContactsView() {
	const { data: contacts, isLoading } = useContacts()
	const deleteContact = useDeleteContact()
	const [isOpen, setIsOpen] = useState(false)

	if (isLoading) {
		return (
			<div className='space-y-3'>
				{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className='h-20 rounded-xl' />)}
			</div>
		)
	}

	const isEmpty = !contacts || contacts.length === 0

	return (
		<>
			<div className='flex items-center justify-between mb-6'>
				<p className='text-sm text-muted-foreground'>
					{isEmpty ? 'No contacts yet' : `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`}
				</p>
				<Button size='sm' className='gap-2' onClick={() => setIsOpen(true)}>
					<Plus className='w-4 h-4' />
					Add contact
				</Button>
			</div>

			{isEmpty ? (
				<div className='flex flex-col items-center justify-center py-24 gap-4'>
					<div className='w-16 h-16 rounded-2xl bg-muted flex items-center justify-center'>
						<UserRound className='w-8 h-8 text-muted-foreground' />
					</div>
					<div className='text-center space-y-1'>
						<h3 className='text-base font-semibold'>No contacts yet</h3>
						<p className='text-sm text-muted-foreground max-w-xs'>
							Track recruiters, hiring managers, and referrals. Connect them to jobs on your board.
						</p>
					</div>
					<Button className='gap-2' onClick={() => setIsOpen(true)}>
						<Plus className='w-4 h-4' />
						Add your first contact
					</Button>
				</div>
			) : (
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
					{contacts.map(contact => (
						<ContactCard
							key={contact.id}
							contact={contact}
							onDelete={() => deleteContact.mutate(contact.id)}
						/>
					))}
				</div>
			)}

			<AddContactModal open={isOpen} onOpenChange={setIsOpen} />
		</>
	)
}

// ── Contact card ──────────────────────────────────────────────────────────────

function ContactCard({ contact, onDelete }: { contact: Contact; onDelete: () => void }) {
	const initials = contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

	return (
		<div className='group rounded-xl border bg-card p-4 flex flex-col gap-3 hover:border-primary/30 hover:shadow-sm transition-all'>
			{/* Header */}
			<div className='flex items-start justify-between gap-2'>
				<div className='flex items-center gap-3 min-w-0'>
					<div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0'>
						{initials}
					</div>
					<div className='min-w-0'>
						<p className='text-sm font-semibold text-foreground truncate'>{contact.name}</p>
						{(contact.title || contact.company) && (
							<p className='text-xs text-muted-foreground truncate'>
								{[contact.title, contact.company].filter(Boolean).join(' · ')}
							</p>
						)}
					</div>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger
						render={props => (
							<Button
								{...props}
								variant='ghost'
								size='icon'
								className={cn('w-7 h-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity', props.className)}
								onClick={e => { e.preventDefault(); props.onClick?.(e) }}
							>
								<MoreHorizontal className='w-4 h-4' />
							</Button>
						)}
					/>
					<DropdownMenuContent align='end' className='w-36'>
						<DropdownMenuItem className='text-destructive' onClick={onDelete}>
							<Trash2 className='w-3.5 h-3.5 mr-2' />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Contact info */}
			<div className='space-y-1.5'>
				{contact.email && (
					<a href={`mailto:${contact.email}`} className='flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors'>
						<Mail className='w-3 h-3 shrink-0' />
						<span className='truncate'>{contact.email}</span>
					</a>
				)}
				{contact.phone && (
					<div className='flex items-center gap-2 text-xs text-muted-foreground'>
						<Phone className='w-3 h-3 shrink-0' />
						<span className='truncate'>{contact.phone}</span>
					</div>
				)}
				{contact.linkedin && (
					<a
						href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://linkedin.com/in/${contact.linkedin}`}
						target='_blank'
						rel='noopener noreferrer'
						className='flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors'
					>
						<Link className='w-3 h-3 shrink-0' />
						<span className='truncate'>LinkedIn</span>
						<ExternalLink className='w-2.5 h-2.5 shrink-0' />
					</a>
				)}
			</div>

			{/* Linked job */}
			{contact.job && (
				<div className='flex items-center gap-1.5 pt-1 border-t'>
					<Building2 className='w-3 h-3 text-muted-foreground shrink-0' />
					<span className='text-xs text-muted-foreground truncate'>
						{contact.job.title} · {contact.job.company}
					</span>
				</div>
			)}

			{/* Added date */}
			<p className='text-[10px] text-muted-foreground'>
				Added {format(new Date(contact.createdAt), 'MMM d, yyyy')}
			</p>
		</div>
	)
}

// ── Add Contact Modal ─────────────────────────────────────────────────────────

function AddContactModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
	const createContact = useCreateContact()

	const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
		resolver: zodResolver(schema),
	})

	async function onSubmit(data: FormValues) {
		await createContact.mutateAsync({
			name: data.name,
			title: data.title ?? null,
			company: data.company ?? null,
			email: data.email || null,
			phone: data.phone ?? null,
			linkedin: data.linkedin ?? null,
			notes: data.notes ?? null,
		})
		reset()
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>Add contact</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-4 py-2'>
					<div className='grid grid-cols-2 gap-3'>
						<div className='space-y-1.5 col-span-2'>
							<Label>Name <span className='text-destructive'>*</span></Label>
							<Input {...register('name')} placeholder='Jane Smith' autoFocus />
							{errors.name && <p className='text-xs text-destructive'>{errors.name.message}</p>}
						</div>
						<div className='space-y-1.5'>
							<Label>Title</Label>
							<Input {...register('title')} placeholder='Recruiter' />
						</div>
						<div className='space-y-1.5'>
							<Label>Company</Label>
							<Input {...register('company')} placeholder='Acme Corp' />
						</div>
						<div className='space-y-1.5'>
							<Label>Email</Label>
							<Input {...register('email')} type='email' placeholder='jane@acme.com' />
							{errors.email && <p className='text-xs text-destructive'>{errors.email.message}</p>}
						</div>
						<div className='space-y-1.5'>
							<Label>Phone</Label>
							<Input {...register('phone')} placeholder='+1 555 000 0000' />
						</div>
						<div className='space-y-1.5 col-span-2'>
							<Label>LinkedIn URL or username</Label>
							<Input {...register('linkedin')} placeholder='linkedin.com/in/janesmith' />
						</div>
						<div className='space-y-1.5 col-span-2'>
							<Label>Notes</Label>
							<Textarea {...register('notes')} placeholder='How you met, key details...' rows={3} className='resize-none' />
						</div>
					</div>

					<DialogFooter>
						<Button type='button' variant='ghost' onClick={() => onOpenChange(false)} disabled={createContact.isPending}>Cancel</Button>
						<Button type='submit' disabled={createContact.isPending}>
							{createContact.isPending ? 'Adding...' : 'Add contact'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
