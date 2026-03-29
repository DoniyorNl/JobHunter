# Dars 04 — User Sync: Supabase Auth → Prisma User Table

## Muammo nimada edi?

Supabase authentication (login/signup) va bizning Prisma `User` jadvalimiz — ikki alohida joy. Foydalanuvchi Supabase orqali ro'yxatdan o'tganda, bizning `User` jadvalida hech narsa paydo bo'lmaydi.

```
Supabase (auth.users)     Bizning DB (public."User")
─────────────────────     ──────────────────────────
id: "uuid-123"            (bo'sh)
email: "ali@test.com"
created_at: ...
```

`prisma.job.create({ data: { userId: "uuid-123", ... } })` chaqirilsa:
```
Foreign key constraint violated on field: `userId`
```

`public."User"` da `uuid-123` yo'q — job yaratib bo'lmaydi.

---

## 3 ta Yechim: Taqqoslash

### Variant A: Faqat Application Code (Server Actions + Callback)

```typescript
// Har signup va callback da ensureUserExists() chaqiriladi
async function signUp() {
  const { data } = await supabase.auth.signUp(...)
  if (data.user) await ensureUserExists(data.user)  // Sync!
}
```

**Afzalliklari:**
- Oddiy, tushunish oson
- Hech qanday DB trigger kerak emas

**Kamchiliklari:**
- Agar kod xato bersa yoki server down bo'lsa — sync bo'lmaydi
- Supabase Admin API orqali yaratilgan userlar — sync bo'lmaydi
- OAuth redirect da `callback/route.ts` ishlamaganda — sync bo'lmaydi
- Har yangi auth usuli (magic link, SSO) qo'shilganda — kod yangilanishi kerak

**Ishonchlilik:** ⭐⭐⭐ (3/5)

---

### Variant B: Faqat Database Trigger

```sql
CREATE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, "createdAt", "updatedAt")
  VALUES (new.id, new.email, ..., NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
```

**Afzalliklari:**
- Atomik — `auth.users` ga insert bilan bir tranzaksiyada `User` yaratiladi
- Universal — barcha auth metodlari uchun ishlaydi
- Xavfsiz — app server down bo'lsa ham ishlaydi

**Kamchiliklari:**
- SQL Editor da qo'lda ishlatish kerak (bir marta)
- Debugging murakkabroq
- `name` ni faqat metadata dan oladi

**Ishonchlilik:** ⭐⭐⭐⭐⭐ (5/5)

---

### Variant C: Trigger + Application Safety Net (biz tanladik) ✅

```
[Supabase] auth.users INSERT
       │
       ▼
[DB Trigger] → public."User" INSERT (atomik, har doim)
       │
       │  (trigger muvaffaqiyatli bo'ldi, lekin app ham tekshiradi)
       ▼
[Application] ensureUserExists(user) → upsert (ON CONFLICT DO UPDATE)
```

```typescript
// src/lib/user.ts
export async function ensureUserExists(supabaseUser: SupabaseUser) {
  const name =
    supabaseUser.user_metadata?.full_name ??
    supabaseUser.user_metadata?.name ??
    supabaseUser.email?.split('@')[0] ??
    'User'

  return prisma.user.upsert({
    where: { id: supabaseUser.id },
    update: { email: supabaseUser.email! },
    create: {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      name,
    },
  })
}
```

**Nima uchun upsert?**
Trigger allaqachon user yaratgan bo'lishi mumkin. `create` ishlatsak — "already exists" xatosi chiqardi. `upsert` (`INSERT ON CONFLICT DO UPDATE`) xavfsiz.

**Ishonchlilik:** ⭐⭐⭐⭐⭐ (5/5) — Ikkala himoya qatlami

---

## `ensureUserExists` Qayerlarda Chaqiriladi

```
1. Email signup (server action)
   src/app/actions/auth.ts → signUpWithEmail()
   → Faqat agar session darhol aktiv bo'lsa (email confirm OFF)

2. OAuth / Magic Link callback
   src/app/(auth)/auth/callback/route.ts
   → exchangeCodeForSession() muvaffaqiyatli bo'lganda

3. DB Trigger (har doim, app dan mustaqil)
   supabase/triggers.sql → on_auth_user_created
```

---

## Trigger Faylini Bir Marta Ishlatish

```sql
-- supabase/triggers.sql
-- Supabase Dashboard → SQL Editor → New Query → Run

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  display_name TEXT;
BEGIN
  display_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'User'
  );

  INSERT INTO public."User" (id, email, name, "createdAt", "updatedAt")
  VALUES (new.id, new.email, display_name, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
```

**`SECURITY DEFINER` nima?**

PostgreSQL da trigger default bo'yicha uni **chaqirgan** user huquqi bilan ishlaydi. `auth.users` jadvaliga oddiy foydalanuvchilar kira olmaydi (`anon` role). `SECURITY DEFINER` — funksiya funksiya **egasining** (postgres) huquqi bilan ishlaydi.

**`SET search_path = public`?**
`SECURITY DEFINER` da SQL injection xavfini kamaytirish uchun qo'llanadi. Malicious user `public` schema ni boshqasi bilan almashtira olmaydi.

---

## Callback Route — OAuth Flow

```typescript
// src/app/(auth)/auth/callback/route.ts
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // DB trigger allaqachon user ni yaratgan bo'lishi mumkin
      // Bu — safety net: agar trigger ishlamagan bo'lsa ham ishlaydi
      try {
        await ensureUserExists(data.user)
      } catch (err) {
        // Trigger allaqachon yaratgan — duplicate, xato normal
        console.error('[callback] ensureUserExists:', err)
      }

      return NextResponse.redirect(`${origin}/board`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}
```

---

## Xulosa — Qaysi Usul Qachon?

| Loyiha turi | Tavsiya |
|-------------|---------|
| Kichik MVP | Faqat `ensureUserExists()` — sodda |
| Production | Trigger + `ensureUserExists()` (Variant C) |
| Supabase Edge Functions | Trigger yetarli |
| Custom auth server | Webhook listener |

**Biz Production standartiga rioya qildik** — ikki qavat himoya.
