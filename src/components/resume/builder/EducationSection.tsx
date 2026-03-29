'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useResumeStore } from '@/stores/resumeStore'
import type { Education } from '@/types/resume'
import { GraduationCap, Plus, Trash2 } from 'lucide-react'
import { SectionHeader } from './PersonalInfoSection'

export function EducationSection() {
	const education = useResumeStore(s => s.data.education)
	const addEducation = useResumeStore(s => s.addEducation)

	return (
		<section>
			<SectionHeader title='Education' />

			<div className='mt-3 space-y-3'>
				{education.map(edu => (
					<EducationCard key={edu.id} edu={edu} />
				))}

				<Button
					type='button'
					variant='outline'
					size='sm'
					className='w-full gap-2 border-dashed h-9'
					onClick={addEducation}
				>
					<Plus className='w-3.5 h-3.5' />
					Add education
				</Button>
			</div>
		</section>
	)
}

function EducationCard({ edu }: { edu: Education }) {
	const update = useResumeStore(s => s.updateEducation)
	const remove = useResumeStore(s => s.removeEducation)

	return (
		<div className='border rounded-lg overflow-hidden'>
			<div className='flex items-center gap-2 px-3 py-2.5 bg-muted/40'>
				<GraduationCap className='w-3.5 h-3.5 text-muted-foreground shrink-0' />
				<span className='flex-1 text-sm font-medium truncate'>
					{edu.school || 'New education'}
				</span>
			</div>

			<div className='px-3 py-3 space-y-2'>
				<div className='grid grid-cols-2 gap-2'>
					<div className='col-span-2'>
						<Label className='text-xs text-muted-foreground'>School / University</Label>
						<Input
							value={edu.school}
							onChange={e => update(edu.id, { school: e.target.value })}
							placeholder='Stanford University'
							className='mt-1 h-8 text-sm'
						/>
					</div>
					<div>
						<Label className='text-xs text-muted-foreground'>Degree</Label>
						<Input
							value={edu.degree}
							onChange={e => update(edu.id, { degree: e.target.value })}
							placeholder='B.S.'
							className='mt-1 h-8 text-sm'
						/>
					</div>
					<div>
						<Label className='text-xs text-muted-foreground'>Field of study</Label>
						<Input
							value={edu.field}
							onChange={e => update(edu.id, { field: e.target.value })}
							placeholder='Computer Science'
							className='mt-1 h-8 text-sm'
						/>
					</div>
					<div>
						<Label className='text-xs text-muted-foreground'>Start year</Label>
						<Input
							value={edu.startDate}
							onChange={e => update(edu.id, { startDate: e.target.value })}
							placeholder='2019'
							className='mt-1 h-8 text-sm'
						/>
					</div>
					<div>
						<Label className='text-xs text-muted-foreground'>End year</Label>
						<Input
							value={edu.endDate ?? ''}
							onChange={e => update(edu.id, { endDate: e.target.value })}
							placeholder='2023'
							className='mt-1 h-8 text-sm'
						/>
					</div>
					<div>
						<Label className='text-xs text-muted-foreground'>GPA (optional)</Label>
						<Input
							value={edu.gpa ?? ''}
							onChange={e => update(edu.id, { gpa: e.target.value })}
							placeholder='3.8/4.0'
							className='mt-1 h-8 text-sm'
						/>
					</div>
				</div>

				<div className='flex justify-end pt-1 border-t'>
					<Button
						type='button'
						variant='ghost'
						size='sm'
						className='h-7 text-xs gap-1.5 text-muted-foreground hover:text-destructive'
						onClick={() => remove(edu.id)}
					>
						<Trash2 className='w-3 h-3' />
						Remove
					</Button>
				</div>
			</div>
		</div>
	)
}
