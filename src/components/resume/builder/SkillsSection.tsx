'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useResumeStore } from '@/stores/resumeStore'
import type { SkillGroup } from '@/types/resume'
import { cn } from '@/lib/utils'
import { Plus, Trash2, X } from 'lucide-react'
import { useRef, KeyboardEvent } from 'react'
import { SectionHeader } from './PersonalInfoSection'

export function SkillsSection() {
	const skills = useResumeStore(s => s.data.skills)
	const addSkillGroup = useResumeStore(s => s.addSkillGroup)

	return (
		<section>
			<SectionHeader title='Skills' />

			<div className='mt-3 space-y-3'>
				{skills.map((group, index) => (
					<SkillGroupCard key={index} group={group} index={index} />
				))}

				<Button
					type='button'
					variant='outline'
					size='sm'
					className='w-full gap-2 border-dashed h-9'
					onClick={addSkillGroup}
				>
					<Plus className='w-3.5 h-3.5' />
					Add skill group
				</Button>
			</div>
		</section>
	)
}

/**
 * Tag-style skill input.
 * Press Enter or comma → skill is added as a tag.
 * Click × on a tag → removes it.
 */
function SkillGroupCard({ group, index }: { group: SkillGroup; index: number }) {
	const updateGroup = useResumeStore(s => s.updateSkillGroup)
	const removeGroup = useResumeStore(s => s.removeSkillGroup)
	const addSkillItem = useResumeStore(s => s.addSkillItem)
	const removeSkillItem = useResumeStore(s => s.removeSkillItem)
	const inputRef = useRef<HTMLInputElement>(null)

	function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		const value = e.currentTarget.value.trim()
		if ((e.key === 'Enter' || e.key === ',') && value) {
			e.preventDefault()
			addSkillItem(index, value)
			e.currentTarget.value = ''
		}
		// Backspace on empty input removes the last tag
		if (e.key === 'Backspace' && !value && group.items.length > 0) {
			removeSkillItem(index, group.items.length - 1)
		}
	}

	return (
		<div className='border rounded-lg overflow-hidden'>
			<div className='px-3 py-3 space-y-2.5'>
				<div>
					<Label className='text-xs text-muted-foreground'>Category name</Label>
					<Input
						value={group.category}
						onChange={e => updateGroup(index, { category: e.target.value })}
						placeholder='e.g. Languages, Frameworks, Tools'
						className='mt-1 h-8 text-sm'
					/>
				</div>

				{/* Tag input */}
				<div>
					<Label className='text-xs text-muted-foreground'>
						Skills{' '}
						<span className='text-muted-foreground/60 font-normal'>— press Enter or comma to add</span>
					</Label>
					<div
						className={cn(
							'mt-1 flex flex-wrap gap-1.5 min-h-9 px-2.5 py-1.5 rounded-md border border-input',
							'bg-transparent transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50',
							'cursor-text',
						)}
						onClick={() => inputRef.current?.focus()}
					>
						{group.items.map((skill, i) => (
							<span
								key={i}
								className='inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5'
							>
								{skill}
								<button
									type='button'
									onClick={e => {
										e.stopPropagation()
										removeSkillItem(index, i)
									}}
									className='hover:text-primary/60'
								>
									<X className='w-2.5 h-2.5' />
								</button>
							</span>
						))}
						<input
							ref={inputRef}
							type='text'
							onKeyDown={handleKeyDown}
							placeholder={group.items.length === 0 ? 'JavaScript, React...' : ''}
							className='flex-1 min-w-20 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
						/>
					</div>
				</div>

				<div className='flex justify-end border-t pt-1'>
					<Button
						type='button'
						variant='ghost'
						size='sm'
						className='h-7 text-xs gap-1.5 text-muted-foreground hover:text-destructive'
						onClick={() => removeGroup(index)}
					>
						<Trash2 className='w-3 h-3' />
						Remove group
					</Button>
				</div>
			</div>
		</div>
	)
}
