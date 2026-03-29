# Dars 07 — Optimistic Updates: Sheet Pattern va React Query Rollback

## Nima qildik?

Job Detail Side Panel — foydalanuvchi karta ustiga bosadi, o'ng tarafdan Sheet siljib chiqadi, barcha maydonlar tahrirlanadi, Save bosadi.

Bu oddiy ko'rinadi, lekin ichida uchta muhim pattern bor:
1. Shared Sheet pattern (bitta instance)
2. `key` prop orqali komponent remount
3. Full optimistic update + rollback

---

## 1. Shared Sheet Pattern — Nima Uchun?

### Anti-pattern: Sheet har kartada

```tsx
// ❌ JobCard.tsx ichida
export function JobCard({ job }: { job: Job }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div onClick={() => setOpen(true)}>...</div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>...</SheetContent>
      </Sheet>
    </>
  )
}
```

**Nima muammo?**
- 30 ta job = 30 ta `Sheet` DOM da mount qilingan
- Har biri `Dialog.Root` (Radix/base-ui) — event listener, focus trap, portal
- Performance muammo + memory

### Correct Pattern: Bitta shared Sheet, Zustand orqali boshqariladi

```
Zustand Store
├── selectedJobId: string | null
├── isDetailOpen: boolean
├── selectJob(id) → selectedJobId = id, isDetailOpen = true
└── setDetailOpen(false) → isDetailOpen = false, selectedJobId = null

JobCard.tsx           → selectJob(job.id) chaqiradi
JobDetailPanel.tsx    → isDetailOpen ni o'qiydi, bitta <Sheet>
BoardView.tsx         → <JobDetailPanel /> bir marta render qiladi
```

```tsx
// JobDetailPanel.tsx — bitta Sheet, har doim mount, visibility = store
export function JobDetailPanel() {
  const isDetailOpen = useBoardStore(s => s.isDetailOpen)
  const setDetailOpen = useBoardStore(s => s.setDetailOpen)
  const job = useBoardStore(s => s.jobs.find(j => j.id === s.selectedJobId))

  return (
    <Sheet open={isDetailOpen} onOpenChange={setDetailOpen}>
      <SheetContent>
        {job && <PanelContent key={job.id} job={job} />}
      </SheetContent>
    </Sheet>
  )
}
```

**Afzalliklari:**
- DOM da faqat 1 ta Dialog — hech qanday overhead
- Sheet animatsiyasi silliq ishlaydi
- `setDetailOpen(false)` bir joyda boshqariladi

---

## 2. `key` Prop — Remount Pattern

### Muammo: Foydalanuvchi boshqa kartani bosdi, panel ochiq

```
User: JobCard A bosdi → selectedJobId = "a", form = job A ma'lumotlari
User: JobCard B bosdi → selectedJobId = "b", job prop o'zgardi
                        Lekin form hali ham A ni ko'rsatadi!
```

### Yechim 1: useEffect (murakkab)

```tsx
function PanelContent({ job }: { job: Job }) {
  const { reset } = useForm(...)

  useEffect(() => {
    reset(jobToForm(job))
  }, [job.id, reset])   // job.id o'zgarganda form qayta to'ldiriladi
}
```

**Kamchilik:** `reset` bilan `keepDirty` logikasi qo'shimcha — user bir maydonni o'zgartirgan bo'lsa ne bo'ladi?

### Yechim 2: `key` prop — Remount (biz tanladik) ✅

```tsx
// JobDetailPanel.tsx
{job && <PanelContent key={job.id} job={job} />}
//                    ^^^^^^^^^^
// React: agar key o'zgarsa — komponentni butunlay yo'q qilib, yangi yaratadi
```

**Nima bo'ladi:**
- `key="job-a"` → React renders PanelContent with job A
- `key="job-b"` → React **unmounts** old + **mounts** new PanelContent
- Yangi mount = yangi `useForm({ defaultValues: jobToForm(job) })` — fresh form!

**Afzalliklari:**
- Hech qanday useEffect kerak emas
- Form, state, ref — hammasi avtomatik reset
- "Ghost state" muammosi yo'q

**Qachon key remount ishlatiladi?**
- Formalar (id o'zgarganda reset kerak)
- Chart/graph (data set o'zgarganda)
- Video/audio player (source o'zgarganda)

---

## 3. React Query Optimistic Update — To'liq Pattern

### Mutation Lifecycle

```
useMutation chaqirilganda:
┌─────────────────────────────────────────────────────┐
│                   onMutate                          │
│  - cancelQueries (race condition oldini olish)      │
│  - snapshot olish (rollback uchun)                  │
│  - store/cache ni darhol yangilash (optimistic)     │
│  - snapshot ni return qilish → context ga o'tadi    │
└──────────────┬──────────────────────────────────────┘
               │ API call (network request)
        ┌──────┴──────┐
        ▼             ▼
   onSuccess      onError
   (server OK)    (server fail)
   │              │
   ▼              ▼
   Store ni       Snapshot dan
   server         store va cache
   javobi bilan   ni qayta tiklash
   yangilash      (rollback)
```

### Kod: `useUpdateJob` to'liq pattern

```typescript
export function useUpdateJob() {
  const queryClient = useQueryClient()
  const updateJobStore = useBoardStore(s => s.updateJob)
  const setJobsStore = useBoardStore(s => s.setJobs)

  return useMutation({
    mutationFn: ({ id, input }) => updateJob(id, input),

    // 1. Darhol UI ni yangilaymiz (user kutmaydi)
    onMutate: async ({ id, input }) => {
      // Race condition: background refetch bizning optimistic update ni ezib tashlashini oldini olamiz
      await queryClient.cancelQueries({ queryKey: JOB_KEYS.lists() })

      // Rollback uchun holatni saqlaymiz
      const previousJobs = queryClient.getQueryData<Job[]>(JOB_KEYS.lists())

      // Store va cache ni darhol yangilaymiz
      updateJobStore(id, input as Partial<Job>)

      // context ga o'tkazamiz
      return { previousJobs }
    },

    // 2. Server OK → server javobi bilan ustini yozamiz (dates, computed fields)
    onSuccess: (updatedJob, { id }) => {
      queryClient.setQueryData<Job[]>(
        JOB_KEYS.lists(),
        old => old?.map(j => (j.id === id ? updatedJob : j)) ?? [],
      )
      updateJobStore(id, updatedJob)
    },

    // 3. Server FAIL → snapshot dan qayta tiklaymiz
    onError: (err, _vars, context) => {
      if (context?.previousJobs) {
        setJobsStore(context.previousJobs)
        queryClient.setQueryData(JOB_KEYS.lists(), context.previousJobs)
      }
      toast.error(err.message)
    },
  })
}
```

### `cancelQueries` nima uchun muhim?

```
Vaqt:    0ms        500ms        1000ms
         │           │             │
User:    PATCH       │             │  (network)
         │           │             │
BG:      │      refetch start  refetch result →  jobs (eski!)
         │           │             │
Store:   [optimistic update]       [BG refetch EZIB TASHLADI!]
                                   ← Race condition!
```

`cancelQueries` → background refetch to'xtatiladi → race condition yo'q.

### Nima uchun `onMutate` async?

```typescript
onMutate: async ({ id, input }) => {
  await queryClient.cancelQueries(...)  // ← Bu async
```

`cancelQueries` in-flight querylarni bekor qilguncha kutadi. `async/await` ishlatmasak, cancel tugamasdan optimistic update boshlanishi mumkin.

---

## 4. `isDirty` — Faqat O'zgargan Bo'lsa Save

```typescript
const { formState: { isDirty } } = useForm(...)

<Button disabled={!isDirty || updateJob.isPending}>
  {updateJob.isPending ? 'Saving...' : isDirty ? 'Save changes' : 'Saved'}
</Button>
```

**React Hook Form `isDirty`:**
- `defaultValues` bilan hozirgi qiymatlarni taqqoslaydi
- Agar hech narsa o'zgarmagan bo'lsa → `isDirty = false` → Save disabled
- Saqlangandan so'ng server javobi bilan `reset` qilinsa → `isDirty = false` → "Saved"

**Nima uchun muhim?**
- Keraksiz API call yo'q
- User "hech narsa o'zgartirmadim" deb biladi (button holati orqali)

---

## 5. Date Input Pattern

```
Database:    Date object (Prisma)
API (JSON):  "2026-01-15T00:00:00.000Z" (ISO string)
Form:        "2026-01-15" (YYYY-MM-DD — <input type="date"> formati)
```

```typescript
// ISO string → "YYYY-MM-DD" for <input type="date">
function toDateInput(val: Date | string | null | undefined): string {
  if (!val) return ''
  return format(new Date(val), 'yyyy-MM-dd')
}

// Form submit: "YYYY-MM-DD" → Date object → JSON.stringify → ISO string
appliedAt: data.appliedAt ? new Date(data.appliedAt) : null
// JSON.stringify(new Date("2026-01-15")) → "2026-01-15T00:00:00.000Z"
// API PATCH: z.string().datetime() → ✅ validates
```

---

## Xulosa — Pattern Qoidalari

| Pattern | Qachon |
|---------|--------|
| Shared Sheet (bitta instance) | Modal/panel bitta komponent boshqaradi |
| `key` prop remount | Form id o'zgarganda clean state kerak |
| `cancelQueries` | Optimistic update + background refetch birgalikda |
| Snapshot + rollback | Muammo bo'lsa UI o'z holiga qaytsin |
| `isDirty` disabled button | Keraksiz API call oldini olish |
