import type { ResumeData } from '@/types/resume'

interface MinimalTemplateProps {
	data: ResumeData
}

/**
 * "Minimal" resume template — ultra-clean, typography-focused.
 * All black and white, generous whitespace, subtle dividers.
 * Ideal for designers, creatives, and tech roles seeking a modern look.
 */
export function MinimalTemplate({ data }: MinimalTemplateProps) {
	const { personalInfo: pi, experience, education, skills } = data

	return (
		<div
			className='bg-white'
			style={{
				width: 794,
				minHeight: 1123,
				padding: '52px 60px',
				fontFamily:
					'"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
				fontSize: 11,
				lineHeight: 1.6,
				boxSizing: 'border-box',
				color: '#111',
			}}
		>
			{/* ── Header ───────────────────────────────────────────────────── */}
			<header style={{ marginBottom: 36 }}>
				<h1
					style={{
						fontSize: 30,
						fontWeight: 300,
						letterSpacing: '-1px',
						color: '#000',
						margin: '0 0 10px 0',
					}}
				>
					{pi.name || 'Your Name'}
				</h1>

				<div
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						gap: '3px 18px',
						fontSize: 10,
						color: '#555',
					}}
				>
					{pi.email && <span>{pi.email}</span>}
					{pi.phone && <span>{pi.phone}</span>}
					{pi.location && <span>{pi.location}</span>}
					{pi.linkedin && <span>{pi.linkedin}</span>}
					{pi.github && <span>{pi.github}</span>}
					{pi.website && <span>{pi.website}</span>}
				</div>
			</header>

			{/* ── Summary ──────────────────────────────────────────────────── */}
			{pi.summary && (
				<MinimalSection title='About'>
					<p style={{ margin: 0, color: '#333', lineHeight: 1.7 }}>{pi.summary}</p>
				</MinimalSection>
			)}

			{/* ── Experience ───────────────────────────────────────────────── */}
			{experience.length > 0 && (
				<MinimalSection title='Experience'>
					{experience.map((exp, i) => (
						<div key={exp.id} style={{ marginBottom: i < experience.length - 1 ? 18 : 0 }}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'baseline',
									marginBottom: 2,
								}}
							>
								<div>
									<span style={{ fontWeight: 600, fontSize: 11.5, color: '#000' }}>
										{exp.title || 'Job Title'}
									</span>
									{exp.company && (
										<span style={{ color: '#555', marginLeft: 8, fontSize: 11 }}>
											{exp.company}
										</span>
									)}
								</div>
								<span
									style={{
										fontSize: 10,
										color: '#888',
										whiteSpace: 'nowrap',
										fontStyle: 'italic',
									}}
								>
									{exp.startDate}
									{(exp.endDate || exp.current) &&
										` – ${exp.current ? 'Present' : exp.endDate}`}
								</span>
							</div>
							{exp.location && (
								<div style={{ fontSize: 10, color: '#888', marginBottom: 5 }}>{exp.location}</div>
							)}
							{exp.bullets.filter(Boolean).length > 0 && (
								<ul
									style={{
										margin: 0,
										paddingLeft: 14,
										listStyleType: 'none',
										color: '#333',
									}}
								>
									{exp.bullets.filter(Boolean).map((bullet, bi) => (
										<li
											key={bi}
											style={{
												marginBottom: 3,
												paddingLeft: 10,
												position: 'relative',
											}}
										>
											<span
												style={{
													position: 'absolute',
													left: 0,
													top: '6px',
													width: 3,
													height: 3,
													borderRadius: '50%',
													backgroundColor: '#000',
												}}
											/>
											{bullet}
										</li>
									))}
								</ul>
							)}
						</div>
					))}
				</MinimalSection>
			)}

			{/* ── Education ────────────────────────────────────────────────── */}
			{education.length > 0 && (
				<MinimalSection title='Education'>
					{education.map((edu, i) => (
						<div key={edu.id} style={{ marginBottom: i < education.length - 1 ? 10 : 0 }}>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'baseline',
								}}
							>
								<span style={{ fontWeight: 600, fontSize: 11.5, color: '#000' }}>
									{edu.school || 'School'}
								</span>
								<span style={{ fontSize: 10, color: '#888', fontStyle: 'italic' }}>
									{edu.startDate}
									{edu.endDate && ` – ${edu.endDate}`}
								</span>
							</div>
							<div style={{ color: '#555', fontSize: 10.5 }}>
								{[edu.degree, edu.field].filter(Boolean).join(', ')}
								{edu.gpa && <span style={{ color: '#888', marginLeft: 8 }}>GPA {edu.gpa}</span>}
							</div>
						</div>
					))}
				</MinimalSection>
			)}

			{/* ── Skills ───────────────────────────────────────────────────── */}
			{skills.length > 0 && (
				<MinimalSection title='Skills'>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
						{skills.map((group, i) => (
							<div key={i} style={{ display: 'flex', gap: 12 }}>
								<span style={{ fontWeight: 600, color: '#000', minWidth: 90, fontSize: 10.5 }}>
									{group.category}
								</span>
								<span style={{ color: '#444', flex: 1 }}>{group.items.join(' · ')}</span>
							</div>
						))}
					</div>
				</MinimalSection>
			)}
		</div>
	)
}

function MinimalSection({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section style={{ marginBottom: 28 }}>
			<h2
				style={{
					fontSize: 9,
					fontWeight: 700,
					letterSpacing: '2px',
					textTransform: 'uppercase',
					color: '#888',
					borderBottom: '1px solid #e5e5e5',
					paddingBottom: 5,
					marginBottom: 12,
					margin: '0 0 12px 0',
				}}
			>
				{title}
			</h2>
			{children}
		</section>
	)
}
