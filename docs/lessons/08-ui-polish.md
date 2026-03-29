# Dars 08 — UI/UX Polish: Modal Animatsiyalari, Auto-close va Default Qiymatlar

## Nima qildik?

Uch ta alohida UX muammosini hal qildik:

1. **Job Detail Panel** "Save Changes" bosilgandan keyin avtomatik yopilmaydi
2. **Sheet va Dialog** qo'pol, animation yo'q
3. **Applied On** date field — har safar qo'lda sana kiritish kerak edi

---

## 1. Modal Auto-Close — Nima Uchun Muhim?

### Avvalgi holat (muammo)

```tsx
// ❌ onSubmit ichida faqat mutate chaqirilgan
async function onSubmit(data: PanelForm) {
  updateJob.mutate({
    id: job.id,
    input: { ...data }
  })
  // Panel yopilmaydi! Foydalanuvchi qo'lda X bosishi kerak
}
```

**Foydalanuvchi uchun muammo:**
- Save bosiladi → ma'lumot saqlanadi → panel ochiq qoladi
- Foydalanuvchi "saqlandi-mi?" degan shubha bilan qoladi
- Yana bir X bosmak kerak → ikki qadam (save + close) = yomon UX

### Yechim: `mutate` o'rniga `mutateAsync`

```tsx
// ✅ mutateAsync — Promise qaytaradi, try/catch bilan ishlatiladi
async function onSubmit(data: PanelForm) {
  try {
    await updateJob.mutateAsync({    // mutate → mutateAsync
      id: job.id,
      input: { ...data }
    })
    setDetailOpen(false)            // Muvaffaqiyatdan KEYIN yop
  } catch {
    // onError handler toast ni ko'rsatadi (qayta throw shart emas)
  }
}
```

### `mutate` vs `mutateAsync` farqi

```
mutate(input)
├── Fire-and-forget (Promise qaytarmaydi)
├── onSuccess/onError callbacklar async
└── try/catch bilan ishlamaydi

mutateAsync(input) → Promise<TData>
├── await qilinadi
├── muvaffaqiyatda TData qaytaradi
└── xatoda throw qiladi → try/catch tutadi
```

**Qachon qaysinisini ishlatish kerak?**

| Vaziyat | Tavsiya |
|---|---|
| Faqat data invalidate qilish kerak | `mutate` |
| Save dan keyin biror narsa qilish (modal yop, navigate) | `mutateAsync` |
| Parallel bir nechta mutation | `mutateAsync` (await bilan sequence) |

---

## 2. Smooth Animations — Sheet va Dialog

### Avvalgi holat (muammo)

```tsx
// ❌ Shadcn default — qo'pol snap
className="... data-[state=open]:animate-in data-[state=closed]:animate-out ..."
// duration yo'q, linear transition
```

Natija: panel darhol paydo bo'ladi/yo'qoladi — "snap" effekti.

### Yechim: Custom cubic-bezier easing

**Fizika:** Haqiqiy dunyo harakati linear emas. Narsa tez boshlaydi, sekinlashadi (ease-out) yoki sekin boshlaydi, tezlashadi (ease-in). Interfeysda **ease-out** eng tabiiy his beradi.

```
cubic-bezier(0.16, 1, 0.3, 1)
    │        │   │   │    │
    │       P1x P1y  P2x  P2y
    │
    └── "Expo Out" easing
        - Juda tez boshlaydi
        - Oxirida yumshoq to'xtaydi
        - Tabletda va mobilda juda yaxshi ko'rinadi
```

```
Harakat grafigi:
1.0 ┤                      ╭──────
0.8 ┤               ╭──────╯
0.6 ┤        ╭──────╯
0.4 ┤   ╭────╯
0.2 ┤ ──╯
0.0 ┤────────────────────────────
    0  0.1  0.2  0.4  0.6  0.8  1.0
         Vaqt →
```

#### Sheet (side panel) uchun

```tsx
// src/components/ui/sheet.tsx

// Overlay (backdrop)
className={cn(
  "fixed inset-0 z-50 bg-black/20",
  "transition-opacity duration-300",
  "ease-[cubic-bezier(0.16,1,0.3,1)]",
  "data-ending-style:opacity-0 data-starting-style:opacity-0",
  "supports-backdrop-filter:backdrop-blur-sm",
)}

// Content (sliding panel)
className={cn(
  "fixed z-50 flex flex-col ...",
  "transition duration-300",                         // 300ms
  "ease-[cubic-bezier(0.16,1,0.3,1)]",
  // O'ng tarafdan chiqish:
  "data-[side=right]:data-starting-style:translate-x-[3rem]",
  "data-[side=right]:data-ending-style:translate-x-[3rem]",
  // Boshlanish/tugash vaqtida opacity 0
  "data-starting-style:opacity-0",
  "data-ending-style:opacity-0",
)}
```

**Nima o'zgardi:**
- Avval: panel darhol chiqadi/yo'qoladi
- Keyin: panel o'ngdan 3rem slidelab chiqadi, 300ms ichida, expo easing bilan

#### Dialog (modal) uchun

```tsx
// src/components/ui/dialog.tsx

// Overlay
"duration-200"   // 200ms — dialog qisqaroq bo'lishi kerak, panel emas

// Content
"duration-200",
"data-open:slide-in-from-bottom-2",    // Pastdan 8px ko'tariladi
"data-closed:slide-out-to-bottom-2",  // Pastga 8px tushadi
"data-open:zoom-in-95",               // 95% dan 100% ga o'sadi
"data-closed:zoom-out-95",
```

**Nima uchun Dialog uchun 200ms, Sheet uchun 300ms?**

| | Sheet | Dialog |
|---|---|---|
| Harakat turi | Slide (uzoq masofa) | Fade + scale (joyida) |
| Optimal davomiylik | 250-400ms | 150-250ms |
| Bizda | 300ms | 200ms |

---

## 3. Applied Date — Default Today

### Muammo

```tsx
// ❌ Avval: appliedAt null bo'lsa, input bo'sh qolardi
function jobToForm(job: Job): PanelForm {
  return {
    appliedAt: toDateInput(job.appliedAt) || '',  // bo'sh!
  }
}
```

Foydalanuvchi har safar "Applied On" fieldni qo'lda to'ldirishi kerak edi. Ko'pincha bugungi sana — foydalanuvchi ariza bergan kun.

### Yechim

```tsx
import { format } from 'date-fns'

function jobToForm(job: Job): PanelForm {
  return {
    // job da sana bo'lsa uni ko'rsat, aks holda bugun
    appliedAt: toDateInput(job.appliedAt) || format(new Date(), 'yyyy-MM-dd'),
  }
}
```

**`format(new Date(), 'yyyy-MM-dd')` nima qaytaradi?**

```
Bugun: 2026-03-29 → "2026-03-29"
```

`<input type="date">` aynan `yyyy-MM-dd` formatni talab qiladi (ISO 8601). Boshqa format (`dd.MM.yyyy` yoki `MM/dd/yyyy`) ishlamaydi.

---

## Yakuniy o'zgarishlar

| Narsa | Avval | Keyin |
|---|---|---|
| Save qilgandan keyin | Panel ochiq qoladi | Panel avtomatik yopiladi |
| Panel animatsiya | Yo'q (snap) | 300ms expo-out slide |
| Dialog animatsiya | Yo'q (snap) | 200ms fade + scale |
| Applied date default | Bo'sh | Bugungi sana |

---

## Qo'shimcha: UX Prinsiplari

### 1. Closure Feedback
> Foydalanuvchi biror amal qilganda, natijasi ko'rinadigan bo'lsin.

Save qilgandan keyin panelning yopilishi — "bajarildi" signali. Toast + yopish = ikki darajali feedback.

### 2. Smart Defaults
> Foydalanuvchidan ma'lumot so'rashdan oldin, eng ko'p ishlatiladigan qiymatni ko'rsat.

Odatda odam ariza bergan kuni "Applied On" ni to'ldiradi → default = bugun.

### 3. Motion Purpose
> Animatsiya faqat ko'rkam uchun emas — u foydalanuvchiga nima bo'layotganini tushuntiradi.

Panel o'ngdan chiqishi — "bu yangi narsa ekranga qo'shildi, u o'ngda joylashgan". Yopilganda o'ngga ketishi — "u qaytib ketdi".
