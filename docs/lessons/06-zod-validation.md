# Dars 06 — Zod Validation: API Layer Pattern

## Muammo nimada edi?

API Route ga kiruvchi ma'lumotlar ishonchsiz. Brauzer to'g'ri ma'lumot yuborishi mumkin, lekin curl, Postman, yoki yomon niyatli foydalanuvchi ixtiyoriy ma'lumot yuborishi mumkin:

```bash
# Brauzer yuboradigan (to'g'ri):
{ "title": "Frontend Developer", "company": "Acme", "status": "APPLIED" }

# Haker yuboradigan:
{ "title": null, "company": "", "status": "INVALID_STATUS", "userId": "boshqa-user-id" }
```

TypeScript faqat **compile time** da yordamlashadi. Runtime da (API Route ichida) `request.json()` — `any` qaytaradi.

---

## Zod nima?

Zod — TypeScript-first runtime validation kutubxonasi.

```typescript
import { z } from 'zod'

const JobCreateSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  status: z.enum(['WISHLIST', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']),
  location: z.string().optional(),
  salary: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
})

// Type ni schemadan avtomatik olish — ikki marta yozish kerak emas!
type JobCreateInput = z.infer<typeof JobCreateSchema>
```

---

## API Route da Zod Pattern

```typescript
// src/app/api/jobs/route.ts
import { z } from 'zod'

const CreateJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  status: z.enum(['WISHLIST', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']),
  location: z.string().optional(),
  salary: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  appliedAt: z.string().datetime().optional(),
})

export async function POST(request: Request) {
  // 1. Auth
  const { user, response } = await requireUser()
  if (response) return response

  // 2. Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid JSON', 400)
  }

  // 3. Validate
  const parsed = CreateJobSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse(
      parsed.error.errors.map(e => e.message).join(', '),
      400
    )
  }

  // 4. Bu yerda parsed.data = JobCreateInput — type-safe!
  const job = await prisma.job.create({
    data: {
      ...parsed.data,
      userId: user.id,  // userId ni clientdan EMAS, serverdan olamiz
    },
  })

  return successResponse(job, 201)
}
```

---

## `safeParse` vs `parse`

```typescript
// parse — xato bo'lsa exception tashlaydi
const data = CreateJobSchema.parse(body)  // ZodError throw qilishi mumkin

// safeParse — xato bo'lsa { success: false, error } qaytaradi
const result = CreateJobSchema.safeParse(body)
if (!result.success) {
  result.error.errors  // Xato ro'yxati
} else {
  result.data  // Validated data
}
```

API Route da **`safeParse`** — xatoni biz boshqaramiz, unhandled exception emas.

---

## Frontend + Backend — Bir Schema

```typescript
// src/lib/validations/job.ts
import { z } from 'zod'

// Bu schemani IKKI JOYDA ishlatamiz:
// 1. Frontend — React Hook Form validatsiya
// 2. Backend — API Route validatsiya
export const JobCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  company: z.string().min(1, 'Company is required').max(200),
  status: z.enum(['WISHLIST', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']),
  location: z.string().max(200).optional(),
  salary: z.string().max(100).optional(),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().max(5000).optional(),
})

export type JobCreateInput = z.infer<typeof JobCreateSchema>
```

```typescript
// Frontend — React Hook Form + Zod
import { zodResolver } from '@hookform/resolvers/zod'
import { JobCreateSchema, type JobCreateInput } from '@/lib/validations/job'

const { register, handleSubmit, formState: { errors } } = useForm<JobCreateInput>({
  resolver: zodResolver(JobCreateSchema),
})
```

```typescript
// Backend — API Route
import { JobCreateSchema } from '@/lib/validations/job'

const parsed = JobCreateSchema.safeParse(body)
```

**Natija:** Bir schema — ikki joyda validatsiya. Frontend da ham, backend da ham bir xil qoidalar.

---

## Muhim Xavfsizlik Nuqtasi: `userId` ni Hech Qachon Clientdan Qabul Qilma

```typescript
// ❌ XAVFLI — userId ni requestdan olamiz
const { title, company, userId } = CreateJobSchema.parse(body)
await prisma.job.create({ data: { title, company, userId } })
// Haker userId = "boshqa-user-id" yuborishi mumkin!

// ✅ TO'G'RI — userId ni autentifikatsiyadan olamiz
const { user, response } = await requireUser()
if (response) return response
const { title, company } = CreateJobSchema.parse(body)
await prisma.job.create({ data: { title, company, userId: user.id } })
// userId har doim haqiqiy foydalanuvchi ID si
```

**Bu pattern — Insecure Direct Object Reference (IDOR) hujumini oldini oladi.**

---

## Zod Transformatsiya

```typescript
const UpdateJobSchema = z.object({
  title: z.string().min(1).optional(),
  salary: z
    .string()
    .optional()
    .transform(val => (val === '' ? undefined : val)),
    // Bo'sh string → undefined (DB da null)

  appliedAt: z
    .string()
    .datetime()
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),
    // String → Date object (Prisma Date field uchun)
})
```

---

## Error Formatlash

```typescript
// Barcha Zod xatolarini bir string ga birlashtirish
parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
// → "title: Title is required, status: Invalid enum value"

// Yoki xatolarni alohida qaytarish (form uchun)
return Response.json({
  success: false,
  errors: parsed.error.flatten().fieldErrors,
  // → { title: ['Title is required'], status: ['Invalid enum value'] }
}, { status: 400 })
```

---

## Xulosa

| Qatlam | Zod ishlatilishi |
|--------|-----------------|
| Frontend form | `zodResolver` — real-time validation |
| API Route input | `safeParse` — runtime validation |
| Type generation | `z.infer<typeof Schema>` — bitta manba |
| Transformatsiya | `.transform()` — string → Date, empty → undefined |

**Golden Rule:**
> **Hech qachon client ma'lumotlariga ishonma. Har doim serverda validate qil.**

Zod bu qoidani TypeScript-friendly usulda amalga oshiradi.
