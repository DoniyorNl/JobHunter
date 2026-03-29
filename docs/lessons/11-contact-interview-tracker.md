# Dars 11 — Contact & Interview Tracker: To'liq CRUD Pattern

## Nima qildik?

Ikkita yangi modul yaratdik:

1. **Contact Tracker** — Recruiter, hiring manager, referrallarni saqlash
2. **Interview Tracker** — Har bir interview ni schedule qilish va kuzatish

Ikkala modul ham bir xil pattern asosida qurilgan. Bu patternni bir marta o'rganib olsangiz, istalgan yangi feature ni ham shu tarzda qura olasiz.

---

## 1. Database Schema (mavjud edi)

```prisma
// prisma/schema.prisma

model Contact {
  id       String   @id @default(cuid())
  userId   String                              // Kim egalik qiladi
  user     User     @relation(...)
  jobId    String?                             // Ixtiyoriy — qaysi job bilan bog'liq
  job      Job?     @relation(...)

  name     String
  title    String?
  company  String?
  email    String?
  phone    String?
  linkedin String?
  notes    String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])        // userId bo'yicha tez qidirish uchun
}

model Interview {
  id          String        @id @default(cuid())
  userId      String
  jobId       String                            // Majburiy — qaysi job uchun
  job         Job           @relation(...)

  type        InterviewType                     // Enum
  scheduledAt DateTime
  duration    Int?                              // Daqiqalarda
  location    String?                           // Zoom, On-site, etc.
  notes       String?       @db.Text
  feedback    String?       @db.Text            // Interview dan keyin

  @@index([userId])
  @@index([jobId])           // Job bo'yicha filter uchun
}

enum InterviewType {
  PHONE_SCREEN
  TECHNICAL
  BEHAVIORAL
  SYSTEM_DESIGN
  TAKE_HOME
  FINAL
  OFFER_CALL
}
```

**Nima uchun `@@index` qo'shilgan?**

```sql
-- Index yo'q bo'lsa:
SELECT * FROM "Interview" WHERE "userId" = '...'
-- Full table scan: barcha rowlarni ko'radi → O(n)

-- Index bor bo'lsa:
-- B-tree index → O(log n) — juda tez
```

Foydalanuvchining barcha interviewlarini yuklash — tez-tez bajariladi. Index = ma'lumotlar ko'paygan sari ham bir xil tezlik.

---

## 2. API Routes Pattern

### URL Struktura

```
/api/contacts          GET  → list all contacts
/api/contacts          POST → create contact
/api/contacts/[id]     PATCH → update contact
/api/contacts/[id]     DELETE → delete contact

/api/interviews        GET  → list all interviews
/api/interviews        POST → create interview
/api/interviews/[id]   PATCH → update interview
/api/interviews/[id]   DELETE → delete interview
```

Bu **RESTful** pattern — har bir resource uchun standart URL va HTTP method.

### Authorization: Har Qadamda Tekshirish

```typescript
// ❌ Xavfli: faqat GET da tekshiriladi
export async function GET() {
  const { user, response } = await requireUser()
  if (response) return response
  // ... foydalanuvchi ID si tekshirilmayapti
  return prisma.contact.findMany()  // BARCHA contactlar qaytadi!
}

// ✅ To'g'ri: har bir query da userId filter
export async function GET() {
  const { user, response } = await requireUser()
  if (response) return response

  const contacts = await prisma.contact.findMany({
    where: { userId: user.id },  // ← Faqat bu userning data si
  })
  return Response.json(successResponse(contacts))
}
```

### Ownership Check — PATCH/DELETE da

```typescript
// Muammo: ID bo'yicha topib, o'zgartirish
// Agar foydalanuvchi boshqa userning ID sini bilsa?

// ❌ Xavfli
await prisma.contact.update({ where: { id } })
// Kim bo'lsayam o'zgartira oladi!

// ✅ To'g'ri: oldin tekshir, keyin o'zgar
async function getOwnedContact(userId: string, id: string) {
  const contact = await prisma.contact.findUnique({ where: { id } })
  if (!contact || contact.userId !== userId) return null
  return contact
}

export async function PATCH(req, { params }) {
  const { user, response } = await requireUser()
  if (response) return response

  const { id } = await params
  const contact = await getOwnedContact(user.id, id)
  if (!contact) return errorResponse('Not found', 404)  // 404, 403 emas
  //                                                      ↑ Security best practice:
  //                        403 = "bor lekin ruxsat yo'q" → ma'lumot beradi
  //                        404 = "bunday narsa yo'q" → safe
```

### Interview uchun Job Ownership Validate

```typescript
// Interview yaratishda: jobId berilgan job bu usernikimi?
const job = await prisma.job.findFirst({
  where: {
    id: parsed.data.jobId,
    userId: user.id,          // ← Muhim: faqat o'z joblariga interview qo'sha oladi
  }
})
if (!job) return errorResponse('Job not found', 404)
```

---

## 3. Input Validation — Zod Schema

```typescript
// Contact uchun
const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z
    .string().email('Invalid email')
    .optional()
    .or(z.literal('')),  // ← Bo'sh string ham qabul qilinadi (ixtiyoriy field)
  // ...
})

// Interview uchun
const createInterviewSchema = z.object({
  type: z.enum(INTERVIEW_TYPES),            // Faqat ruxsat etilgan qiymatlar
  scheduledAt: z.string().datetime(),       // ISO 8601 datetime
  duration: z.number().int().min(5).max(480).optional(),  // 5 daqiqa - 8 soat
})
```

**`z.string().email().optional().or(z.literal(''))`** — nima bu?

```
Vaziyat 1: email = "jane@acme.com"   → ✅ valid email
Vaziyat 2: email = undefined          → ✅ optional
Vaziyat 3: email = ""                 → ✅ bo'sh string (form bo'sh yuborilganda)
Vaziyat 4: email = "notanemail"       → ❌ validation error
```

---

## 4. Frontend Pattern

### Data Flow

```
Page (Server Component)
  └── QueryProvider
        └── ContactsView (Client Component)
              │
              ├── useContacts()   → GET /api/contacts
              ├── useCreateContact()  → POST /api/contacts
              └── useDeleteContact()  → DELETE /api/contacts/[id]
```

### React Query Hooks Tuzilishi

```typescript
// Har bir operation uchun alohida hook
function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    staleTime: 60_000,
  })
}

function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })  // List ni yangilash
      toast.success('Contact added')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
```

### Optimistic Delete

```typescript
function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteContact,

    // 1. API ga yuborishdan OLDIN — UI dan olib tashla
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['contacts'] })
      const prev = qc.getQueryData<Contact[]>(['contacts'])  // Backup
      qc.setQueryData<Contact[]>(['contacts'], old => old?.filter(c => c.id !== id))
      return { prev }  // Context ga saqlash
    },

    onSuccess: () => toast.success('Contact removed'),

    // 2. API xato bersa — asl holatiga qaytarish (rollback)
    onError: (e: Error, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['contacts'], ctx.prev)
      toast.error(e.message)
    },
  })
}
```

**Nima uchun optimistic delete?**

```
Normal delete:
Bosish → spinner → 200ms wait → UI yangilanadi
→ Foydalanuvchi o'chirish natijasini 200ms kutadi

Optimistic delete:
Bosish → UI darhol yangilanadi → background da API
→ Foydalanuvchi natijani darhol ko'radi
→ Agar xato bo'lsa → rollback + toast
```

---

## 5. Interview UI — Upcoming/Past Ajratish

```typescript
import { isFuture, isPast, isToday } from 'date-fns'

// Upcoming: bugun yoki kelajakda
const upcoming = interviews?.filter(
  i => !isPast(new Date(i.scheduledAt)) || isToday(new Date(i.scheduledAt))
) ?? []

// Past: bugundan oldin (bugun bundan tashqari)
const past = interviews?.filter(
  i => isPast(new Date(i.scheduledAt)) && !isToday(new Date(i.scheduledAt))
) ?? []
```

**Nima uchun bu muhim?**

Foydalanuvchi kelajakdagi interviewlarga tayyorlanmoqchi. Ular birinchi bo'lib ko'rinishi kerak. O'tib ketgan interviewlar (feedback yozish uchun) pastda.

```
┌─────────────────────────────┐
│  UPCOMING                   │
│  ┌──────────────────────┐   │
│  │ 30 │ Meta - Technical │   │
│  │ Mar│ Tomorrow 2:00 PM │   │
│  └──────────────────────┘   │
│                             │
│  PAST                       │
│  ┌──────────────────────┐   │
│  │ 25 │ Google - Phone  │   │
│  │ Mar│ Past            │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

### Status Badge Renglari

```typescript
const TYPE_COLORS: Record<InterviewType, string> = {
  PHONE_SCREEN: 'bg-blue-100 text-blue-700',
  TECHNICAL:    'bg-purple-100 text-purple-700',
  BEHAVIORAL:   'bg-orange-100 text-orange-700',
  SYSTEM_DESIGN:'bg-pink-100 text-pink-700',
  TAKE_HOME:    'bg-yellow-100 text-yellow-700',
  FINAL:        'bg-green-100 text-green-700',
  OFFER_CALL:   'bg-emerald-100 text-emerald-700',
}
```

Har bir interview type uchun alohida rang — foydalanuvchi bir qarashda tipni tushunadi (visual hierarchy).

---

## 6. Form — datetime-local ni ISO ga Aylantirilishi

```typescript
// Form da ikki alohida field: date va time
const formSchema = z.object({
  date: z.string().min(1, 'Date is required'),  // "2026-04-15"
  time: z.string().min(1, 'Time is required'),  // "14:30"
  // ...
})

// Submit paytida birlashtirish
async function onSubmit(data: FormValues) {
  // "2026-04-15" + "T" + "14:30" → "2026-04-15T14:30"
  const scheduledAt = new Date(`${data.date}T${data.time}`).toISOString()
  // toISOString() → "2026-04-15T11:30:00.000Z" (UTC ga konvertatsiya)
}
```

**Nima uchun `<input type="date">` va `<input type="time">` alohida?**

`<input type="datetime-local">` browser larда har xil ko'rinadi va UX yaxshi emas. Ikki alohida input — aniq, boshqarish oson.

---

## Yakuniy o'zgarishlar

### Yangi fayllar

```
src/app/api/contacts/route.ts
src/app/api/contacts/[id]/route.ts
src/app/api/interviews/route.ts
src/app/api/interviews/[id]/route.ts

src/components/contacts/ContactsView.tsx
src/components/interviews/InterviewsView.tsx
```

### O'zgartirilgan fayllar

| Fayl | Nima qo'shildi |
|---|---|
| `app/(dashboard)/contacts/page.tsx` | `ContactsView` + header |
| `app/(dashboard)/interviews/page.tsx` | `InterviewsView` + header |

### Avval va keyin

| | Avval | Keyin |
|---|---|---|
| `/contacts` | "Coming in Phase 4" placeholder | To'liq CRUD UI |
| `/interviews` | "Coming in Phase 4" placeholder | Schedule + view interviews |
| API `/api/contacts` | Yo'q | GET, POST, PATCH, DELETE |
| API `/api/interviews` | Yo'q | GET, POST, PATCH, DELETE |
