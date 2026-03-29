# Dars 05 — Next.js App Router: Server Actions vs API Routes

## Kontekst

Next.js 13+ App Router ikkita yo'l taklif qiladi server-side logika uchun:
1. **Server Actions** — funksiya, form yoki button orqali chaqiriladi
2. **API Routes** — REST endpoint, `fetch()` orqali chaqiriladi

Loyihada biz ikkalasini ham ishlatamiz. Qachon qaysi biri tanlanganini tushunib olaylik.

---

## Server Actions nima?

```typescript
// src/app/actions/auth.ts
'use server'  // ← Bu direktiva bu faylni Server Action qiladi

export async function signUpWithEmail(payload: {
  name: string
  email: string
  password: string
  origin: string
}): Promise<SignUpResult> {
  // Bu kod FAQAT serverda ishlaydi — bundle da yo'q
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ ... })
  // ...
}
```

Client component da ishlatish:

```typescript
// src/app/(auth)/signup/page.tsx
'use client'
import { signUpWithEmail } from '@/app/actions/auth'

function SignUpForm() {
  async function onSubmit(formData: FormData) {
    // Bu chaqiruv brauzerdan serverga HTTP request yuboradi (POST /actions endpoint)
    const result = await signUpWithEmail({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      origin: window.location.origin,
    })
    if (result.error) setError(result.error)
  }
}
```

---

## API Routes nima?

```typescript
// src/app/api/jobs/route.ts
export async function GET(request: Request) {
  const { user, response } = await requireUser()
  if (response) return response

  const jobs = await prisma.job.findMany({ where: { userId: user.id } })
  return Response.json({ success: true, data: jobs })
}

export async function POST(request: Request) {
  const { user, response } = await requireUser()
  if (response) return response

  const body = await request.json()
  // ...
}
```

Client component da ishlatish:

```typescript
// src/components/board/AddJobModal.tsx
async function createJob(data: FormValues) {
  const response = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const result = await response.json()
}
```

---

## Taqqoslash Jadvali

| Xususiyat | Server Action | API Route |
|-----------|--------------|-----------|
| Transport | Next.js internal (encrypted POST) | HTTP REST |
| Chaqiruv | `import` + funksiya call | `fetch('/api/...')` |
| Tashqi API dan foydalanish | ❌ Mumkin emas (Next.js internal) | ✅ Boshqa applar ham ishlatishi mumkin |
| TypeScript type safety | ✅ End-to-end (import bilan) | ⚠️ Qo'lda type (zod bilan) |
| Loading state | React `useTransition` | `useState` + manual |
| Cache/Revalidation | `revalidatePath()`, `revalidateTag()` | `fetch` cache headers |
| Form bilan ishlash | ✅ Native (`action={myAction}`) | ❌ `preventDefault` kerak |
| JavaScript disable bo'lsa | ✅ Ishlaydi (progressive enhancement) | ❌ Ishlamaydi |
| Streaming | ✅ `useFormState` bilan | ⚠️ SSE kerak |
| Prisma/DB to'g'ridan to'g'ri | ✅ | ✅ |

---

## Biz Nima Va Nima Uchun Tanladik

### Server Actions ishlatilgan joy: **Authentication**

```typescript
// src/app/actions/auth.ts
export async function signUpWithEmail(...): Promise<SignUpResult>
```

**Nima uchun Server Action?**
- Signup — **bir martalik form submit**. Fetch loop yo'q.
- TypeScript type safety muhim — `SignUpResult` type client da ham, server da ham bir xil
- `origin` (site URL) ni server da ishlatish kerak — bu faqat form submit paytida kerak
- Kelajakda `revalidatePath('/board')` qo'shish qulay

### API Routes ishlatilgan joy: **Jobs CRUD**

```typescript
// src/app/api/jobs/route.ts         → GET (list), POST (create)
// src/app/api/jobs/[id]/route.ts    → GET (detail), PATCH (update), DELETE
```

**Nima uchun API Route?**
- Jobs — **ko'p marta, turli komponentlardan** chaqiriladi (BoardView, JobCard, drag-drop)
- Kelajakda **Kanban board da real-time sync** (WebSocket yoki SSE) kerak bo'lishi mumkin — API endpoint qulay
- **Zustand store** bilan birga ishlatiladi — store fetch qilib, state yangilaydi
- Tashqi API integratsiyasi mumkin (Chrome extension, mobile app kelajakda)

---

## Server Actions — Progressiv Enhancement

```tsx
// JavaScript o'chiq bo'lsa ham ishlaydi!
<form action={signUpWithEmail}>
  <input name="email" type="email" />
  <button type="submit">Sign up</button>
</form>
```

Brauzer `action` attributiga POST yuboradi → Next.js Server Action ishga tushadi.

**Lekin bizda** form complex validation bor (Zod, React Hook Form) — shuning uchun `handleSubmit` ishlatamiz, pure HTML form emas.

---

## API Response Standarti

```typescript
// src/types/api.ts
export function successResponse<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status: number, code?: string) {
  return Response.json({ success: false, error: { message, code } }, { status })
}
```

**Nima uchun wrapper funksiyalar?**
- Barcha API javoblari bir xil formatda
- Client da `if (result.success)` — yagona pattern
- Error `message` va `code` alohida — UI da `code` ga qarab turli xabar ko'rsatish mumkin

```typescript
// Client da:
const result = await fetch('/api/jobs').then(r => r.json())
if (!result.success) {
  if (result.error.code === 'UPGRADE_REQUIRED') showUpgradeModal()
  else toast.error(result.error.message)
}
```

---

## Zustand + API Route — State Management

```typescript
// src/store/boardStore.ts (soddalashtirilgan)
export const useBoardStore = create<BoardState>((set, get) => ({
  jobs: [],

  fetchJobs: async () => {
    const res = await fetch('/api/jobs')
    const { data } = await res.json()
    set({ jobs: data })
  },

  createJob: async (jobData) => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    })
    const { data: newJob } = await res.json()
    set(state => ({ jobs: [...state.jobs, newJob] }))
  },
}))
```

**Nima uchun Zustand?**
- Server Component dan Client Component ga prop drilling yo'q
- Board, AddJobModal, JobCard — barchasi bir store dan o'qiydi
- `optimistic update` qo'shish oson: darhol state ni yangilab, keyin API call, xato bo'lsa rollback

---

## Xulosa — Qoida

```
Bir martalik mutatsiya + TypeScript type safety muhim → Server Action
Takrorlangan read/write + tashqi foydalanish mumkin bo'lishi kerak → API Route
```

| Loyihada | Tanlov | Sabab |
|----------|--------|-------|
| `signUpWithEmail` | Server Action | Form, bir martalik, type-safe |
| `GET /api/jobs` | API Route | Zustand, ko'p komponet, kelajakda external |
| `POST /api/jobs` | API Route | Zustand, drag-drop, batching |
| `DELETE /api/jobs/:id` | API Route | REST semantics, idempotent |
