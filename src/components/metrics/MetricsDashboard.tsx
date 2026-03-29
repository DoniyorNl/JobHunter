'use client'

import { useQuery } from '@tanstack/react-query'
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	FunnelChart,
	Funnel,
	LabelList,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Briefcase, Trophy, MessageSquare, Target } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface MetricsData {
	totals: {
		total: number
		wishlist: number
		active: number
		rejected: number
		offer: number
	}
	kpis: {
		responseRate: number
		interviewRate: number
		offerRate: number
	}
	byStatus: { status: string; count: number }[]
	timeline: { date: string; count: number }[]
	pipeline: { stage: string; count: number }[]
}

// ── Status colors ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
	WISHLIST: '#94a3b8',
	APPLIED: '#3b82f6',
	PHONE_SCREEN: '#a855f7',
	INTERVIEW: '#f59e0b',
	OFFER: '#22c55e',
	REJECTED: '#ef4444',
	WITHDRAWN: '#9ca3af',
}

const STATUS_LABELS: Record<string, string> = {
	WISHLIST: 'Wishlist',
	APPLIED: 'Applied',
	PHONE_SCREEN: 'Phone Screen',
	INTERVIEW: 'Interview',
	OFFER: 'Offer',
	REJECTED: 'Rejected',
	WITHDRAWN: 'Withdrawn',
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchMetrics(): Promise<MetricsData> {
	const res = await fetch('/api/metrics')
	if (!res.ok) throw new Error('Failed to fetch metrics')
	const { data } = await res.json()
	return data
}

// ── Main component ────────────────────────────────────────────────────────────

export function MetricsDashboard() {
	const { data, isLoading } = useQuery({
		queryKey: ['metrics'],
		queryFn: fetchMetrics,
		staleTime: 60_000,
	})

	if (isLoading) return <MetricsSkeleton />

	if (!data || data.totals.total === 0) {
		return (
			<div className='flex flex-col items-center justify-center py-32 gap-4'>
				<div className='w-16 h-16 rounded-2xl bg-muted flex items-center justify-center'>
					<TrendingUp className='w-8 h-8 text-muted-foreground' />
				</div>
				<div className='text-center space-y-1'>
					<h3 className='text-base font-semibold'>No data yet</h3>
					<p className='text-sm text-muted-foreground max-w-xs'>
						Start adding jobs to your board to see your job search analytics here.
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{/* ── KPI Cards ─────────────────────────────────────────────────── */}
			<div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
				<KpiCard
					icon={<Briefcase className='w-4 h-4' />}
					label='Total Applications'
					value={data.totals.total}
					sub={`${data.totals.active} active`}
					color='text-blue-500'
					bg='bg-blue-50 dark:bg-blue-950/30'
				/>
				<KpiCard
					icon={<MessageSquare className='w-4 h-4' />}
					label='Response Rate'
					value={`${data.kpis.responseRate}%`}
					sub='Got a response'
					color='text-purple-500'
					bg='bg-purple-50 dark:bg-purple-950/30'
				/>
				<KpiCard
					icon={<Target className='w-4 h-4' />}
					label='Interview Rate'
					value={`${data.kpis.interviewRate}%`}
					sub='Of responses'
					color='text-amber-500'
					bg='bg-amber-50 dark:bg-amber-950/30'
				/>
				<KpiCard
					icon={<Trophy className='w-4 h-4' />}
					label='Offer Rate'
					value={`${data.kpis.offerRate}%`}
					sub='Of interviews'
					color='text-green-500'
					bg='bg-green-50 dark:bg-green-950/30'
				/>
			</div>

			{/* ── Charts row ────────────────────────────────────────────────── */}
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
				{/* Timeline chart — wider */}
				<div className='lg:col-span-2 rounded-xl border bg-card p-5'>
					<h3 className='text-sm font-semibold mb-1'>Applications — Last 30 Days</h3>
					<p className='text-xs text-muted-foreground mb-4'>New jobs added per day</p>
					<TimelineChart data={data.timeline} />
				</div>

				{/* Status donut chart */}
				<div className='rounded-xl border bg-card p-5'>
					<h3 className='text-sm font-semibold mb-1'>By Status</h3>
					<p className='text-xs text-muted-foreground mb-4'>Current distribution</p>
					<StatusDonut data={data.byStatus} />
				</div>
			</div>

			{/* ── Pipeline funnel ───────────────────────────────────────────── */}
			{data.pipeline.length > 0 && (
				<div className='rounded-xl border bg-card p-5'>
					<h3 className='text-sm font-semibold mb-1'>Application Pipeline</h3>
					<p className='text-xs text-muted-foreground mb-4'>
						How applications progress through each stage
					</p>
					<PipelineFunnel data={data.pipeline} />
				</div>
			)}
		</div>
	)
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
	icon,
	label,
	value,
	sub,
	color,
	bg,
}: {
	icon: React.ReactNode
	label: string
	value: string | number
	sub: string
	color: string
	bg: string
}) {
	return (
		<div className='rounded-xl border bg-card p-4 flex flex-col gap-3'>
			<div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center ${color}`}>
				{icon}
			</div>
			<div>
				<p className='text-2xl font-bold text-foreground tracking-tight'>{value}</p>
				<p className='text-xs font-medium text-foreground mt-0.5'>{label}</p>
				<p className='text-xs text-muted-foreground mt-0.5'>{sub}</p>
			</div>
		</div>
	)
}

// ── Timeline Bar Chart ────────────────────────────────────────────────────────

function TimelineChart({ data }: { data: { date: string; count: number }[] }) {
	// Show only every 5th label to avoid crowding
	const tickFormatter = (val: string, idx: number) => (idx % 5 === 0 ? val : '')

	return (
		<ResponsiveContainer width='100%' height={180}>
			<BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
				<XAxis
					dataKey='date'
					tick={{ fontSize: 10, fill: '#94a3b8' }}
					tickFormatter={tickFormatter}
					axisLine={false}
					tickLine={false}
				/>
				<YAxis
					allowDecimals={false}
					tick={{ fontSize: 10, fill: '#94a3b8' }}
					axisLine={false}
					tickLine={false}
				/>
				<Tooltip
					cursor={{ fill: 'hsl(var(--muted))' }}
					contentStyle={{
						fontSize: 12,
						borderRadius: 8,
						border: '1px solid hsl(var(--border))',
						background: 'hsl(var(--popover))',
						color: 'hsl(var(--popover-foreground))',
					}}
					labelStyle={{ fontWeight: 600 }}
				/>
				<Bar dataKey='count' fill='#3b82f6' radius={[3, 3, 0, 0]} name='Applications' />
			</BarChart>
		</ResponsiveContainer>
	)
}

// ── Status Donut ──────────────────────────────────────────────────────────────

function StatusDonut({ data }: { data: { status: string; count: number }[] }) {
	const total = data.reduce((s, d) => s + d.count, 0)

	return (
		<div className='flex flex-col gap-3'>
			<ResponsiveContainer width='100%' height={140}>
				<PieChart>
					<Pie
						data={data}
						cx='50%'
						cy='50%'
						innerRadius={40}
						outerRadius={65}
						paddingAngle={2}
						dataKey='count'
						nameKey='status'
					>
						{data.map(entry => (
							<Cell
								key={entry.status}
								fill={STATUS_COLORS[entry.status] ?? '#94a3b8'}
							/>
						))}
					</Pie>
					<Tooltip
						contentStyle={{
							fontSize: 12,
							borderRadius: 8,
							border: '1px solid hsl(var(--border))',
							background: 'hsl(var(--popover))',
							color: 'hsl(var(--popover-foreground))',
						}}
						formatter={(value: number, name: string) => [
							value,
							STATUS_LABELS[name] ?? name,
						]}
					/>
				</PieChart>
			</ResponsiveContainer>

			{/* Legend */}
			<div className='space-y-1.5'>
				{data.map(entry => (
					<div key={entry.status} className='flex items-center justify-between text-xs'>
						<div className='flex items-center gap-2'>
							<span
								className='w-2.5 h-2.5 rounded-sm shrink-0'
								style={{ backgroundColor: STATUS_COLORS[entry.status] ?? '#94a3b8' }}
							/>
							<span className='text-muted-foreground'>
								{STATUS_LABELS[entry.status] ?? entry.status}
							</span>
						</div>
						<span className='font-medium tabular-nums'>
							{entry.count}
							<span className='text-muted-foreground ml-1'>
								({Math.round((entry.count / total) * 100)}%)
							</span>
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

// ── Pipeline Funnel ───────────────────────────────────────────────────────────

const FUNNEL_COLORS = ['#3b82f6', '#a855f7', '#f59e0b', '#22c55e']

function PipelineFunnel({ data }: { data: { stage: string; count: number }[] }) {
	return (
		<ResponsiveContainer width='100%' height={100}>
			<FunnelChart>
				<Tooltip
					contentStyle={{
						fontSize: 12,
						borderRadius: 8,
						border: '1px solid hsl(var(--border))',
						background: 'hsl(var(--popover))',
						color: 'hsl(var(--popover-foreground))',
					}}
				/>
				<Funnel dataKey='count' data={data} isAnimationActive>
					{data.map((entry, i) => (
						<Cell key={entry.stage} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
					))}
					<LabelList
						position='right'
						content={({ value, name }) => (
							<text fontSize={11} fill='hsl(var(--foreground))'>
								{name}: {value}
							</text>
						)}
					/>
				</Funnel>
			</FunnelChart>
		</ResponsiveContainer>
	)
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function MetricsSkeleton() {
	return (
		<div className='space-y-6'>
			<div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className='h-28 rounded-xl' />
				))}
			</div>
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
				<Skeleton className='lg:col-span-2 h-56 rounded-xl' />
				<Skeleton className='h-56 rounded-xl' />
			</div>
		</div>
	)
}
