# Dars 10 — Metrics Dashboard: API Aggregation va Recharts

## Nima qildik?

Job search analytics uchun to'liq dashboard:

- **KPI cards** — Jami arizalar, response rate, interview rate, offer rate
- **Timeline chart** — 30 kunlik ariza tarixi (bar chart)
- **Status donut** — Status bo'yicha taqsimot (pie chart)
- **Pipeline funnel** — WISHLIST → APPLIED → INTERVIEW → OFFER funnel

---

## 1. Ma'lumot Qayerdan Keladi?

### Muammo
Dashboard uchun bir necha turdagi ma'lumot kerak:
- Har bir statusda nechtadan job bor?
- So'nggi 30 kunda har kuni nechtadan ariza berilgan?
- Response rate nima?

Bu ma'lumotlarni **client-side** hisoblash mumkin edi — barcha joblarni yuklab, JavaScript bilan filter/group qilish. Lekin bu yomon:

```
❌ Client-side approach:
GET /api/jobs → 500 ta job yuklanadi
JavaScript → group by status → count
JavaScript → filter last 30 days → group by date

Muammo:
- 500 ta job = 500 ta record network orqali
- Qimmat (bandwidth, time)
- Foydalanuvchi ko'p job qo'shganida juda sekin bo'ladi
```

### Yechim: Server-side Aggregation

```
✅ Server-side approach:
GET /api/metrics → Faqat aggregated numbers qaytaradi

{
  totals: { total: 47, applied: 12, ... },
  kpis: { responseRate: 58, interviewRate: 25, ... },
  timeline: [{ date: "Mar 01", count: 2 }, ...],
  pipeline: [{ name: "Applied", value: 12 }, ...]
}
```

Database o'zi hisoblaydi — tezroq, kamroq ma'lumot uzatiladi.

---

## 2. API Aggregation Pattern

### Parallel Queries — Nima Uchun?

```typescript
// ❌ Sequential (ketma-ket)
const statusCounts = await prisma.job.groupBy(...)   // 50ms
const recentJobs = await prisma.job.findMany(...)    // 50ms
const totalCount = await prisma.job.count(...)       // 50ms
// Total: ~150ms

// ✅ Parallel
const [statusCounts, recentJobs, totalCount] = await Promise.all([
  prisma.job.groupBy({ by: ['status'], ... }),
  prisma.job.findMany({ where: { createdAt: { gte: subDays(...) } }, ... }),
  prisma.job.count({ where: { userId: user.id } }),
])
// Total: ~50ms (hammasi bir vaqtda bajariladi)
```

**3x tezroq** — har bir query mustaqil, bir-birini kutmaydi.

### `groupBy` — SQL GROUP BY ning Prisma versiyasi

```typescript
const statusCounts = await prisma.job.groupBy({
  by: ['status'],
  where: { userId: user.id },
  _count: { id: true },
})

// Natija:
// [
//   { status: 'APPLIED', _count: { id: 12 } },
//   { status: 'INTERVIEW', _count: { id: 5 } },
//   { status: 'OFFER', _count: { id: 1 } },
//   ...
// ]
```

**SQL ekvivalenti:**
```sql
SELECT status, COUNT(id)
FROM "Job"
WHERE "userId" = $1
GROUP BY status
```

### Ma'lumotlarni Qayta Ishlash

```typescript
// Array → Map: O(n) lookup
const byStatus = statusCounts.reduce((acc, row) => {
  acc[row.status] = row._count.id
  return acc
}, {} as Record<string, number>)
// { APPLIED: 12, INTERVIEW: 5, OFFER: 1, ... }

// KPI hisoblash
const applied = byStatus['APPLIED'] ?? 0
const phoneScreen = byStatus['PHONE_SCREEN'] ?? 0
const interview = byStatus['INTERVIEW'] ?? 0
const offer = byStatus['OFFER'] ?? 0

// Response rate = (phone screen + interview + offer) / total * 100
const responseRate = total > 0
  ? Math.round(((phoneScreen + interview + offer) / total) * 100)
  : 0
```

### 30 Kunlik Timeline

```typescript
// date-fns: So'nggi 30 kunning har bir kunini hosil qil
const days = eachDayOfInterval({
  start: subDays(new Date(), 29),
  end: new Date(),
})

// recentJobs dan map: { "2026-03-15": 3, "2026-03-20": 1, ... }
const countByDay = recentJobs.reduce((acc, job) => {
  const key = format(startOfDay(job.createdAt), 'yyyy-MM-dd')
  acc[key] = (acc[key] ?? 0) + 1
  return acc
}, {} as Record<string, number>)

// 30 ta kun — hammasi (0 bo'lsa ham)
const timeline = days.map(day => ({
  date: format(day, 'MMM d'),          // "Mar 15"
  count: countByDay[format(day, 'yyyy-MM-dd')] ?? 0,
}))
```

**Nima uchun `eachDayOfInterval`?**

Database da data bo'lmagan kunlar (0 ta ariza) query natijasida ko'rinmaydi. Agar faqat database natijasini ishlatsak, chartda ba'zi kunlar tushib ketadi — chiziq uziladi. `eachDayOfInterval` barcha 30 kunni hosil qiladi, bo'sh kunlarga `0` qo'yadi.

```
Faqat DB dan:          eachDayOfInterval bilan:
Mar 01: 2             Mar 01: 2
Mar 05: 1             Mar 02: 0  ← to'ldirildi
Mar 12: 3             Mar 03: 0
                      Mar 04: 0
                      Mar 05: 1
                      ...
Bar chart: uzilgan    Bar chart: to'liq
```

---

## 3. Frontend — Recharts

### Nima Uchun Recharts?

```
Chart kutubxonalar solishtirish:

Chart.js
  ✅ Keng tarqalgan, ko'p misollar
  ❌ Canvas based — SVG animatsiya yo'q
  ❌ React bilan integratsiya qiyin (imperative API)

D3.js
  ✅ Eng kuchli, to'liq nazorat
  ❌ O'rganish qiyin, kod ko'p
  ❌ React bilan conflict (ikkalasi DOM ni boshqarmoqchi)

Recharts
  ✅ React uchun yozilgan (declarative)
  ✅ SVG based — responsive, animatsiyali
  ✅ Kichik API, o'rganish oson
  ✅ TypeScript support
```

### Komponent Arxitekturasi

```
MetricsDashboard (main)
├── isLoading → MetricsSkeleton
├── data yo'q → Empty state
└── data bor →
    ├── KPI Cards row
    │   ├── KpiCard (Total)
    │   ├── KpiCard (Response Rate)
    │   ├── KpiCard (Interview Rate)
    │   └── KpiCard (Offer Rate)
    ├── Charts row
    │   ├── TimelineChart (BarChart)
    │   └── StatusDonut (PieChart)
    └── PipelineFunnel (FunnelChart)
```

### BarChart — Timeline

```tsx
<ResponsiveContainer width="100%" height={200}>
  <BarChart data={timeline}>
    {/* X axis — kun nomi: "Mar 1", "Mar 2", ... */}
    <XAxis
      dataKey="date"
      tickLine={false}       // Tick chiziqlarini olib tashla
      axisLine={false}       // Axis chiziqni olib tashla
      tick={{ fontSize: 11 }}
    />
    {/* Y axis — faqat butun sonlar */}
    <YAxis
      allowDecimals={false}
      tickLine={false}
      axisLine={false}
      width={20}
    />
    <Tooltip />
    <Bar dataKey="count" name="Applications" radius={[4, 4, 0, 0]} />
                                            {/* ↑ Yuqori burchaklar rounded */}
  </BarChart>
</ResponsiveContainer>
```

**`ResponsiveContainer` nima?**
Chart ni parent container ga to'liq kengaytiradi. `width="100%"` — column qanchalik keng bo'lsa, chart ham shuncha keng.

### PieChart — Status Donut

```tsx
<PieChart>
  <Pie
    data={pieData}          // [{ name: 'Applied', value: 12, color: '#...' }]
    dataKey="value"
    nameKey="name"
    innerRadius={55}        // ← Donut uchun (0 bo'lsa to'liq doira)
    outerRadius={80}
    paddingAngle={2}        // Qismlar orasidagi bo'shliq
  >
    {pieData.map(entry => (
      <Cell key={entry.name} fill={entry.color} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>
```

**`innerRadius > 0` = Donut chart** — markazda KPI raqam ko'rsatish imkoniyati beradi.

---

## 4. Stale Time — Nima Uchun 60 Soniya?

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['metrics'],
  queryFn: fetchMetrics,
  staleTime: 60_000,  // 1 daqiqa
})
```

Metrics — real-time bo'lishi shart emas. Foydalanuvchi sahifalar orasida tez-tez o'tsa ham, 1 daqiqa ichida metrics o'zgarishi mumkin emas (odatda). `staleTime: 60_000` → 1 daqiqa davomida API ga qayta so'rov yuborilmaydi. Kamroq network, tezroq sahifa.

---

## Yakuniy o'zgarishlar

### Yangi fayllar

```
src/app/api/metrics/route.ts          ← API aggregation endpoint
src/components/metrics/MetricsDashboard.tsx  ← Dashboard UI
```

### O'zgartirilgan fayllar

| Fayl | Nima qo'shildi |
|---|---|
| `app/(dashboard)/metrics/page.tsx` | `MetricsDashboard` + `QueryProvider` |
| `package.json` | `recharts` dependency |

### Dashboard ko'rinishi

```
┌──────────────────────────────────────────────────────────────────┐
│  Metrics                                                         │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  47      │  │  58%     │  │  25%     │  │  2%      │        │
│  │  Total   │  │  Response│  │  Interview│ │  Offers  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│  ┌──────────────────────────┐  ┌───────────────────┐            │
│  │  Applications (30 days)  │  │  Status breakdown │            │
│  │  ▓▓ ▓ ▓▓▓ ▓ ▓ ▓ ▓▓ ▓   │  │     🍩 donut      │            │
│  └──────────────────────────┘  └───────────────────┘            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Pipeline                                                 │   │
│  │  [WISHLIST: 20] → [APPLIED: 12] → [INTERVIEW: 5] → ...  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```
