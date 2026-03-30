# Lesson 13 — AI-Powered Resume PDF Import

## What We Built

Users can now upload their existing PDF resume to the platform. The AI (Gemini 2.0 Flash)
reads the PDF directly, extracts all structured data (personal info, experience, education,
skills, certifications), and saves it as an editable resume in the builder.

---

## Why This Matters

Before this feature, users had to manually type every field in the resume builder.
Most job seekers already have a resume — they should be able to just upload it and start
tailoring it, not re-type their entire career history.

---

## Architecture Decision: Why Gemini Multimodal?

There are three ways to parse a PDF resume:

| Approach | Pros | Cons |
|---|---|---|
| **1. Server-side PDF parser** (pdf-parse, pdfjs-dist) | Full control, no API cost | Extra npm package (1–2 MB), handles only text — no layout awareness |
| **2. Client-side JS PDF parser** (pdfjs-dist) | No server roundtrip for extraction | Very heavy bundle (~3 MB), complex Web Worker setup |
| **3. Gemini multimodal** (our choice) | Zero extra packages, layout-aware, understands tables/columns/headers | Costs 1 AI call per import, slower |

**We chose Gemini multimodal** because:
- Gemini 2.0 Flash can read PDFs natively via `inlineData` — no parsing library needed
- It understands layout: columns, tables, bullet points, headers — text extractors miss this
- One fewer dependency in the bundle
- Same infrastructure we already use for AI bullets/tailor

---

## How It Works (Full Flow)

```
Browser                     Next.js Server              Gemini API
   │                              │                           │
   │  1. User picks PDF file      │                           │
   │  2. FileReader.readAsDataURL │                           │
   │  3. Extract base64 after ","  │                           │
   │                              │                           │
   │─── POST /api/ai/parse-resume ─►                          │
   │   { pdfBase64, mimeType,     │                           │
   │     title, template }        │                           │
   │                              │                           │
   │                              │─── model.generateContent ─►
   │                              │   [                       │
   │                              │     { inlineData:         │
   │                              │       { mimeType,         │
   │                              │         data: base64 } }, │
   │                              │     "Parse this resume..."│
   │                              │   ]                       │
   │                              │                           │
   │                              │◄── ResumeData JSON ───────│
   │                              │                           │
   │                              │  prisma.resume.create()   │
   │                              │                           │
   │◄─── { data: resume } ────────│                           │
   │                              │                           │
   │  router.push(`/resumes/id`)  │                           │
```

---

## Key Code Patterns

### 1. Sending PDF to Gemini as Inline Data

```typescript
// src/app/api/ai/parse-resume/route.ts

const result = await model.generateContent([
  {
    inlineData: {
      mimeType: 'application/pdf',   // tells Gemini this is a PDF
      data: pdfBase64,               // raw base64 string (NO "data:..." prefix)
    },
  },
  AI_PROMPTS.PARSE_RESUME_PDF(),     // text prompt describing what to extract
])
```

**Why an array?** Gemini multimodal takes an array of "parts" — each part is either
text or media. Order matters: put the file first, then the instruction.

### 2. Reading File as Base64 on the Client

```typescript
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // result = "data:application/pdf;base64,ACTUAL_BASE64_HERE"
      //                                        ↑ we only want this part
      const result = reader.result as string
      const base64 = result.split(',')[1]
      if (!base64) reject(new Error('Failed to read file'))
      else resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
```

**Important**: `readAsDataURL` returns a Data URL with a MIME prefix.
We must strip `data:application/pdf;base64,` before sending to Gemini —
Gemini wants raw base64, not the full Data URL.

### 3. Graceful Degradation

```typescript
// If Gemini fails, we still save the resume — just empty
// The user can fill it in manually in the builder

try {
  const extracted = parseJsonResponse<ResumeData>(text)
  if (extracted?.personalInfo) {
    resumeData = extracted
  }
} catch (err) {
  console.error('[parse-resume] AI error:', err)
  // resumeData stays as EMPTY_RESUME_DATA — no crash, user just gets a blank resume
}

// Save regardless
await prisma.resume.create({ data: { ...resumeData } })
```

**Why graceful degradation?** If the PDF is scanned (image-only) or Gemini has a
rate limit hit, the user shouldn't get an error page. They get an empty resume
they can fill in manually — still better than nothing.

---

## Prompt Engineering for Resume Parsing

The prompt (`PARSE_RESUME_PDF`) specifies the **exact JSON shape** expected:

```typescript
PARSE_RESUME_PDF: () => `
You are a resume parser. Read the attached resume PDF and extract all information.

Return ONLY valid JSON (no markdown code blocks) matching this exact structure:
{
  "personalInfo": { "name": "", "email": "", ... },
  "experience": [{ "id": "exp-1", "company": "", "bullets": [] }],
  "education": [...],
  "skills": [{ "category": "Languages", "items": [] }],
  "certifications": [...]
}

Rules:
- Keep bullet points as-is from the original
- Group skills by category
- Generate unique IDs: "exp-1", "exp-2", etc.
- If a field is missing, use "" or []
`.trim()
```

**Lessons learned about AI prompts:**
1. **Always specify output format exactly** — without `Return ONLY valid JSON`, the model wraps output in ```json code blocks``` which break `JSON.parse()`
2. **Provide ID generation rules** — without this, the model may omit IDs or generate duplicate ones
3. **Use "Rules:" section** — clear numbered/bulleted rules are easier for the model to follow than prose

---

## UI Pattern: Drag & Drop File Zone

```typescript
<div
  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
  onDragLeave={() => setIsDragging(false)}
  onDrop={handleDrop}
  onClick={() => !file && fileInputRef.current?.click()}
>
  <input ref={fileInputRef} type='file' accept='application/pdf' className='sr-only' />
  {/* Visual content */}
</div>
```

**Key details:**
- `e.preventDefault()` on `dragOver` is mandatory — without it, the browser opens the file instead of triggering `onDrop`
- `className='sr-only'` hides the ugly native input but keeps it accessible for keyboard users
- `!file && fileInputRef.current?.click()` — when a file is already selected, clicking the zone should NOT re-open the picker (confusing UX)

---

## File Validation

```typescript
if (selected.type !== 'application/pdf') {
  toast.error('Only PDF files are supported')
  return
}
if (selected.size > 10 * 1024 * 1024) {
  toast.error('File must be smaller than 10 MB')
  return
}
```

**Why 10 MB limit?** Gemini's inline data has a practical limit around 20 MB, but
we set 10 MB because:
1. Typical resumes are 100 KB–2 MB — 10 MB is generous
2. Larger files = more base64 = larger HTTP request body = slower

**Why check `type`?** The `accept='application/pdf'` attribute on the input only
filters the file picker UI — a user can still drag & drop any file type. Always
validate on the client AND consider server-side validation too.

---

## CreateResumeModal: Two-Mode Design

The modal was redesigned from a single form to a **3-step flow**:

```
State: 'choose' → either 'scratch' or 'import'
         ↓                     ↓
   [ScratchForm]          [ImportPDFForm]
         ↓                     ↓
    router.push()         router.push()
```

**Why 3 states instead of a tabs UI?**
- Tabs keep both forms mounted — wastes memory and React state
- 3 states = only the active form is mounted = cleaner state management
- "Back" button feels more natural than switching tabs mid-form

```typescript
type Mode = 'choose' | 'scratch' | 'import'

export function CreateResumeModal({ open, onOpenChange }) {
  const [mode, setMode] = useState<Mode>('choose')

  function handleClose() {
    onOpenChange(false)
    // Reset to 'choose' AFTER the close animation finishes
    setTimeout(() => setMode('choose'), 300)
  }
```

**Why `setTimeout` for reset?** If we reset `mode` to `'choose'` immediately on close,
the modal briefly flashes back to the choose screen before the close animation finishes.
300 ms matches the dialog animation duration.

---

## What Changed

| File | Change |
|---|---|
| `src/lib/ai/prompts.ts` | Added `PARSE_RESUME_PDF` prompt |
| `src/app/api/ai/parse-resume/route.ts` | New endpoint — validates, calls Gemini multimodal, saves resume |
| `src/components/resume/CreateResumeModal.tsx` | Redesigned to 3-mode flow (choose/scratch/import) |
| `src/components/resume/ResumeList.tsx` | Empty state shows two option cards |
