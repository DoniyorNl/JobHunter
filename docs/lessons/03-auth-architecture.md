# Dars 03 — Auth Arxitekturasi: `requireUser()` va Discriminated Union

## Muammo nimada edi?

Har bir API route da autentifikatsiya tekshiruvi takrorlanmoqda edi:

```typescript
// /api/jobs/route.ts
async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return errorResponse('Unauthorized', 401)
  // ...
}
```

```typescript
// /api/jobs/[id]/route.ts — XUDDI SHUNDAY takrorlangan!
async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

**Muammolar:**
1. Bir xil kod 2 joyda — DRY (Don't Repeat Yourself) buzilishi
2. TypeScript `user` ni `null | User` deb biladi — har joyda narrowing kerak
3. Kelajakda `user.plan` (premium check) qo'shmoqchi bo'lsak — har route da o'zgartirish

---

## Yechim — `src/lib/auth.ts`

```typescript
// src/lib/auth.ts
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { errorResponse } from '@/types/api'
import { createClient } from './supabase/server'

type AuthSuccess = { user: SupabaseUser; response: null }
type AuthFailure = { user: null; response: Response }
export type AuthResult = AuthSuccess | AuthFailure

export async function requireUser(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, response: errorResponse('Unauthorized', 401) }
  }

  return { user, response: null }
}
```

---

## Discriminated Union nima?

TypeScript da **Discriminated Union** — bu bir nechta turdagi object ni birlashtirgan type bo'lib, ularni ajratish uchun umumiy bir field (discriminant) ishlatiladi.

```typescript
// Discriminant field: "response"
type AuthSuccess = { user: SupabaseUser; response: null }     // response = null
type AuthFailure = { user: null;         response: Response } // response = Response object
type AuthResult = AuthSuccess | AuthFailure
```

**Bu nima beradi?**

```typescript
const { user, response } = await requireUser()

if (response) {
  // Bu blokda TypeScript biladi:
  // response = Response (non-null)
  // user = null
  return response
}

// Bu yerda TypeScript biladi:
// user = SupabaseUser (non-null!) — as cast kerak emas
// response = null
console.log(user.id)    // ✅ TypeScript xato bermaydi
console.log(user.email) // ✅
```

### Solishtiruv: Boshqa yondashuv (yomonroq)

```typescript
// ❌ Kamroq type-safe yondashuv
async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user // null | SupabaseUser
}

// API route da:
const user = await getUser()
if (!user) return errorResponse('Unauthorized', 401)

// Bu yerda TypeScript user ni hali ham null | SupabaseUser deb ko'radi!
// Shuning uchun qo'shimcha type assertion kerak:
user!.id    // Non-null assertion — xavfli
(user as SupabaseUser).id  // Type cast — verbose
```

Discriminated Union bilan TypeScript `if (response) return response` dan keyin avtomatik narrowing qiladi.

---

## Qanday Ishlatiladi

```typescript
// Har bir API route da — bir qator
export async function GET() {
  const { user, response } = await requireUser()
  if (response) return response
  // Endi user = SupabaseUser, TypeScript biladi
  
  const jobs = await prisma.job.findMany({ where: { userId: user.id } })
  return Response.json(successResponse(jobs))
}
```

---

## Middleware bilan Farqi

```
Middleware (src/middleware.ts)           requireUser() (src/lib/auth.ts)
─────────────────────────────────────   ─────────────────────────────────
Edge runtime da ishlaydi                Server runtime da ishlaydi
Har requestda bajariladi                Faqat uni chaqirgan routeda
Redirect qiladi                         Response qaytaradi
/board, /resumes himoyalaydi            /api/jobs/* himoyalaydi
```

**Ikkisi birgalikda ishlaydi:**
1. Middleware — brauzer sahifalarini himoyalaydi (`/board` → `/login`)
2. `requireUser()` — API endpointlarni himoyalaydi (401 qaytaradi)

**Nima uchun ikkalasi ham kerak?**

```
Brauzer → /board          → Middleware redirect → /login ✅
Fetch   → /api/jobs       → requireUser() → 401 JSON ✅
Fetch   → /api/jobs (bilan cookie) → requireUser() → user ✅
```

API call `Unauthorized` xatosi redirect yemas, JSON response kutadi. Shuning uchun middleware uni to'xtata olmaydi.

---

## Kelajakdagi Kengaytma

`requireUser()` ni kelajakda quyidagicha kengaytirish mumkin:

```typescript
// Faqat PRO foydalanuvchilar uchun
export async function requireProUser(): Promise<AuthResult> {
  const result = await requireUser()
  if (result.response) return result  // Unauthenticated

  const dbUser = await prisma.user.findUnique({ where: { id: result.user.id } })
  if (dbUser?.plan !== 'PRO') {
    return {
      user: null,
      response: errorResponse('Pro subscription required', 403, 'UPGRADE_REQUIRED')
    }
  }

  return result
}

// AI endpointlarda:
export async function POST(req: Request) {
  const { user, response } = await requireProUser()
  if (response) return response
  // ...
}
```

---

## Xulosa

| Yondashuv | Afzallik | Kamchilik |
|-----------|----------|-----------|
| Har routeda `getAuthenticatedUser()` | Sodda | Takrorlash, type-unsafe |
| `requireUser()` global helper | DRY, type-safe, kengaytma mumkin | — |
| Middleware only | Oddiy | Faqat redirectlar uchun |

**Senior pattern:** Global auth helper + discriminated union — barcha API routelarda bitta pattern.
