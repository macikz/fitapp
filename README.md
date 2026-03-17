# FitApp 🏋️

Osobní fitness aplikace – tréninkový deník + sledování maker. Jednoduchý MVP pro osobní použití.

## Co aplikace umí

- **Tréninkový plán** – vytvoř dny a cviky s cílovým rozsahem opakování a skokem váhy
- **Záznam tréninku** – zapiš výkon po sériích, aplikace automaticky vyhodnotí a doporučí co dělat příště
- **Jídlo & makra** – napiš volným textem co jsi jedl, AI odhadne kalorie a makra
- **Dashboard** – přehled dnešních maker vs cíl, rychlé akce, poslední tréninky
- **Nastavení** – váha, cíl (nabírání/udržování/hubnutí), denní makro cíle

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS**
- **localStorage** – data ukládána v prohlížeči, žádný backend
- **Anthropic API** – analýza maker z volného textu (server-side API route)

---

## Spuštění lokálně

### 1. Závislosti

```bash
cd fitapp
npm install
```

### 2. API klíč

Zkopíruj `.env.local.example` jako `.env.local` a vlož svůj Anthropic API klíč:

```bash
cp .env.local.example .env.local
```

Otevři `.env.local` a nahraď hodnotu:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxx
```

API klíč získáš na https://console.anthropic.com/

### 3. Spuštění

```bash
npm run dev
```

Otevři http://localhost:3000

---

## Nasazení na Vercel

1. Nahraj projekt na GitHub (nebo GitLab / Bitbucket)

2. Jdi na https://vercel.com a přihlaš se

3. Klikni **New Project** → importuj své repo

4. Ve **Vercel dashboard → Settings → Environment Variables** přidej:
   ```
   ANTHROPIC_API_KEY = sk-ant-xxxxxxxxxxxxxxxxx
   ```

5. Klikni **Deploy**

Vercel automaticky detekuje Next.js a nasadí aplikaci. Dostaneš veřejný odkaz jako `https://fitapp-xxx.vercel.app`.

---

## Struktura projektu

```
fitapp/
├── app/
│   ├── layout.tsx           # Root layout + navigace
│   ├── page.tsx             # Dashboard
│   ├── globals.css          # Globální styly + design tokeny
│   ├── training/
│   │   ├── page.tsx         # Správa tréninkového plánu
│   │   └── [dayId]/
│   │       └── page.tsx     # Záznam tréninku + historie
│   ├── food/
│   │   └── page.tsx         # Zadání jídla + makra
│   ├── settings/
│   │   └── page.tsx         # Nastavení profilu
│   └── api/
│       └── analyze-food/
│           └── route.ts     # API route → Anthropic (analýza maker)
├── components/
│   ├── Nav.tsx              # Spodní navigace
│   ├── MacroBar.tsx         # Progress bar pro makra
│   └── ExerciseEvaluation.tsx  # Vyhodnocení cviku
├── lib/
│   ├── types.ts             # TypeScript typy
│   ├── storage.ts           # localStorage helpers
│   └── evaluation.ts        # Logika vyhodnocení tréninku
├── .env.local.example
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## Poznámky

- **Data jsou uložena v prohlížeči** (localStorage). Pokud smažeš data prohlížeče, ztratíš záznamy. Pro zálohu stačí exportovat localStorage klíče přes DevTools.
- **Analýza maker** volá Anthropic API – každé odeslání jídla spotřebuje pár centů kreditů. Pro osobní použití je to zanedbatelné.
- Aplikace funguje bez přihlášení – je určena jen pro tebe.
