# Dars 09 — Resume Builder: Templatelar, PDF Export va Duplication

## Nima qildik?

Resume Builder uchun to'liq 3 ta funksiya:

1. **3 ta HTML template** — Modern, Classic, Minimal
2. **PDF Export** — `html2canvas` + `jsPDF` bilan client-side
3. **Resume Duplication** — mavjud resumeni nusxalash

---

## 1. Nima Uchun 3 Ta Template?

### Muammo
Bitta template = bitta dizayn = foydalanuvchi tanlov qila olmaydi. HR va hiring managerlar turli sohalar uchun turli resume formatlarini afzal ko'radi:

| Template | Kim uchun |
|---|---|
| **Modern** | Tech, startup, dizayn sohalari |
| **Classic** | Finance, yuridik, katta korporatsiyalar |
| **Minimal** | Content/UX, ijodiy kasblar |

### Arxitektura

```
src/components/resume/builder/
├── ModernTemplate.tsx    ← Tailwind bilan yozilgan
├── ClassicTemplate.tsx   ← Inline CSS, Georgia serif
├── MinimalTemplate.tsx   ← Inline CSS, Inter, whitespace-heavy
├── ResumePreview.tsx     ← Scaled down preview + ResumeFullSize
└── ResumeBuilder.tsx     ← Main builder, export trigger
```

### Nima Uchun Inline CSS?

```tsx
// ❌ Tailwind — PDF da ishlamaydi
<h1 className="text-2xl font-bold text-gray-900">John Doe</h1>

// ✅ Inline style — html2canvas to'g'ri o'qiydi
<h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111' }}>John Doe</h1>
```

**Sabab:** `html2canvas` DOM elementni canvas ga chizadi. Tailwind CSS `className` lar computed style orqali ishlaydi. Ba'zi murakkab Tailwind class lar (custom properties, arbitrary values) html2canvas tomonidan to'g'ri o'qilmasligi mumkin. Inline style esa DOM da to'g'ridan-to'g'ri saqlanadi — doim ishonchli.

### Template Tanlovi — Zustand Store

```tsx
// store ichida
interface ResumeStore {
  template: 'modern' | 'classic' | 'minimal'
  setTemplate: (t: string) => void
}

// ResumePreview.tsx
const template = useResumeStore(s => s.template)

return (
  <div>
    {template === 'classic' ? (
      <ClassicTemplate data={data} />
    ) : template === 'minimal' ? (
      <MinimalTemplate data={data} />
    ) : (
      <ModernTemplate data={data} />           // default
    )}
  </div>
)
```

---

## 2. PDF Export — html2canvas + jsPDF

### Muammo
Browser da HTML ni PDF qilishning bir nechta usuli bor:

```
1. window.print() → CSS @media print
   ✅ Oson
   ❌ Styling nazorat qilish qiyin
   ❌ Har xil browser = har xil natija

2. Puppeteer (server-side headless Chrome)
   ✅ Mukammal natija
   ❌ Server kerak, serverless da qimmat
   ❌ Cold start latency

3. html2canvas + jsPDF (client-side)
   ✅ Server kerak emas
   ✅ Foydalanuvchi browserida ishlaydi
   ✅ Pixel-perfect rendering
   ❌ Katta bundle (~400KB)
```

**Nima uchun html2canvas + jsPDF tanladik?**

Bu private SaaS app — foydalanuvchi o'z browserida ishlatadi. Server-side rendering kerak emas. Bundle size muammo emas chunki dinamik import ishlatamiz.

### Arxitektura

```
Foydalanuvchi "Export PDF" bosadi
         │
         ▼
handleExportPDF()
         │
         ├── Dynamic import: html2canvas (lazy load)
         ├── Dynamic import: jsPDF (lazy load)
         │
         ▼
DOM da yashirin div: id="resume-export-target"
  position: fixed
  left: -9999px   ← Screen tashqarisida, lekin DOM da bor
  z-index: -1
         │
         ▼
html2canvas(element, { scale: 2 })
  scale: 2 → Retina display sifati (2x pixel density)
         │
         ▼
canvas → PNG image data
         │
         ▼
jsPDF → A4 format
  210mm × 297mm → aspectratio hisoblanadi
  Agar content > 1 page → yangi page qo'shiladi
         │
         ▼
pdf.save("resume-title.pdf")
  Browser → Fayl yuklaydi
```

### Kod

```typescript
// src/lib/pdf-export.ts

export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  // Dynamic import — foydalanuvchi bosguncha yuklanmaydi
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const element = document.getElementById(elementId)
  if (!element) throw new Error('Element not found')

  // scale: 2 → Retina quality (200dpi)
  const canvas = await html2canvas(element, { scale: 2, useCORS: true })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')  // portrait, mm, A4

  const pdfWidth = pdf.internal.pageSize.getWidth()   // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight() // 297mm

  const imgWidth = pdfWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  // Birinchi page
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pdfHeight

  // Ko'p sahifali resume
  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight
  }

  pdf.save(`${filename}.pdf`)
}
```

### Nima Uchun Yashirin Div?

```
Preview (kichik, scaled down)    Export target (to'liq A4 size)
┌─────────────────┐             ┌─────────────────────────────┐
│  ┌───────────┐  │             │ JOHN DOE                    │
│  │ John Doe  │  │             │ Software Engineer           │
│  │ scale:0.6 │  │             │                             │
│  └───────────┘  │             │ EXPERIENCE                  │
└─────────────────┘             │ ...                         │
    Foydalanuvchi               │ (To'liq A4: 794px × 1123px) │
    ko'radigan preview          └─────────────────────────────┘
                                  html2canvas dan o'qiydi
```

Preview 60% scale down qilingan — lekin PDF da to'liq o'lchamda bo'lishi kerak. Shuning uchun alohida `ResumeFullSize` komponent bor, `position: fixed; left: -9999px` da render qilinadi.

---

## 3. Resume Duplication

### Muammo
Foydalanuvchi bir resume asosida har bir job uchun customized version yaratmoqchi. Noldan yaratish = ko'p vaqt.

### Flow

```
Foydalanuvchi "Duplicate" bosadi
        │
        ▼
useDuplicateResume.mutate(resume.id)
        │
        ▼
1. GET /api/resumes/{id}  ← Source resume ni yukla
        │
        ▼
2. POST /api/resumes  ← Yangi yarat, data ni ko'chir
   {
     title: "My Resume (copy)",
     template: source.template,
     sourceData: source.data    ← Muhim: barcha bo'limlar bilan
   }
        │
        ▼
Server: sourceData bo'lsa uni ishlatadi
  const resumeData = parsed.data.sourceData ?? EMPTY_RESUME_DATA
        │
        ▼
React Query cache invalidate → UI yangilanadi
```

### API Schema o'zgarishi

```typescript
// Avval — faqat bo'sh resume yaratilardi
const createResumeSchema = z.object({
  title: z.string().min(1),
  targetRole: z.string().optional(),
  template: z.enum(['modern', 'classic', 'minimal']).default('modern'),
  // sourceData yo'q edi
})

// Keyin — duplication uchun sourceData qo'shildi
const createResumeSchema = z.object({
  title: z.string().min(1),
  targetRole: z.string().optional(),
  template: z.enum(['modern', 'classic', 'minimal']).default('modern'),
  sourceData: z.unknown().optional(),    // ← Yangi
})
```

**Nima uchun `z.unknown()`?** Resume data strukturasi katta va o'zgaruvchan JSON. Uni to'liq Zod schema bilan validatsiya qilish ortiqcha — biz faqat "biror narsa bor yoki yo'q" ni tekshirmoqchimiz.

---

## Yakuniy o'zgarishlar

### Yangi fayllar

```
src/components/resume/builder/
├── ClassicTemplate.tsx   ← Yangi (Georgia serif, dark header)
├── MinimalTemplate.tsx   ← Yangi (Inter, clean white, wide margins)
└── ResumePreview.tsx     ← Modified (template switch + ResumeFullSize export)

src/lib/
└── pdf-export.ts         ← Yangi (html2canvas + jsPDF utility)
```

### O'zgartirilgan fayllar

| Fayl | Nima qo'shildi |
|---|---|
| `ResumeBuilder.tsx` | Export PDF button, yashirin export div |
| `useResumes.ts` | `duplicateResume()` + `useDuplicateResume()` hook |
| `ResumeList.tsx` | "Duplicate" dropdown item |
| `api/resumes/route.ts` | `sourceData` field, `EMPTY_RESUME_DATA` fallback |

---

## Qo'shimcha: Dynamic Import Pattern

```typescript
// ❌ Static import — har safar bundle da yuklanadi
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// ✅ Dynamic import — faqat kerak bo'lganda yuklanadi
const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
  import('html2canvas'),
  import('jspdf'),
])
```

**Oqibat:** App initial bundle ~400KB yengillashadi. Foydalanuvchi "Export PDF" bosmaguncha bu kutubxonalar yuklanmaydi. Next.js bu import ni alohida chunk ga ajratadi.

---

## Davomiy O'rganish

- [html2canvas docs](https://html2canvas.hertzen.com/configuration)
- [jsPDF docs](https://artskydj.github.io/jsPDF/docs/jsPDF.html)
- `scale: 2` haqida: [Retina screen rendering](https://html2canvas.hertzen.com/configuration) — `window.devicePixelRatio` ishlatish ham mumkin
