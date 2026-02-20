# CLAUDE.md - NCL App

## Ruolo di Claude

Claude è lo **sviluppatore principale** di questo progetto, nonché:
- **UX/UI Designer** - Responsabile dell'esperienza utente e del design dell'interfaccia
- **Consulente Infrastruttura** - Guida le decisioni architetturali e di deployment
- **Consulente Sicurezza** - Verifica e implementa best practices di sicurezza

---

## Panoramica del Progetto

**NCL App** è una piattaforma completa per la gestione di tornei sportivi che include:

### Sito Pubblico
- Homepage dinamica con widget personalizzabili
- Calendario partite e risultati (con supporto video)
- Classifiche e tabelle di campionato
- Visualizzazione bracket playoff
- Profili giocatori e statistiche
- Profili squadre e storico
- News con sistema di commenti e like, feed in stile social e composer inline (`admin/editor`) con publish/draft
- Gallerie fotografiche
- Archivio stagioni
- Supporto multilingua (IT, EN, NL)

### Pannello Admin
- CRUD completo per squadre, giocatori, sedi, competizioni
- Gestione partite con operazioni bulk
- Generatore automatico calendario
- Import giocatori/partite via Excel
- Dashboard torneo con gestione fasi
- Layout builder homepage (drag-and-drop)
- Gestione tema e branding
- Gestione utenti, articoli, gallerie, sponsor

---

## Tech Stack

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | React 18, TypeScript 5.5, Vite 6.3 |
| **Styling** | Tailwind CSS 3.4, shadcn/ui, Radix UI |
| **State/Data** | TanStack React Query, React Hook Form, Zod |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **Mobile** | Capacitor 7.4 (iOS/Android) |
| **i18n** | i18next (IT, EN, NL) |
| **Icone** | Lucide React |
| **Grafici** | Recharts |

---

## Struttura del Progetto

```
src/
├── App.tsx                 # Routing principale e provider
├── main.tsx                # Entry point React
├── globals.css             # Stili globali
├── components/             # 94+ componenti React
│   ├── admin/              # Componenti admin (layout-builder, dialogs, ecc.)
│   │   └── schedule-generator/  # Generatore calendario (presets, event entry, vincoli, stats)
│   ├── auth/               # Autenticazione (RequireAuth, AvatarUploader)
│   ├── news/               # Composer news inline (`NewsComposer`)
│   ├── ui/                 # Componenti shadcn/ui (NON modificare)
│   └── ...                 # Altri componenti feature
├── pages/                  # 54 pagine
│   ├── Index.tsx           # Homepage pubblica
│   ├── admin/              # 40+ pagine admin
│   └── auth/               # Login, Profile
├── hooks/                  # 24 custom hooks (use-matches, use-teams, ecc.)
├── lib/
│   ├── supabase/           # Client e auth context
│   ├── news/               # Utilities news (`articleComposer`)
│   ├── i18n.ts             # Configurazione traduzioni
│   └── utils.ts            # Utilities generali
├── types/
│   └── database.ts         # Interfacce TypeScript per DB
├── utils/                  # Utilities (toast, ecc.)
└── locales/                # File traduzioni (en, it, nl)
```

---

## Convenzioni di Codice

### Struttura
- **Route** in `src/App.tsx`
- **Pagine** in `src/pages/`
- **Componenti** in `src/components/`
- **Hook personalizzati** in `src/hooks/`
- **Tipi** in `src/types/`

### Styling
- Usare **Tailwind CSS** per tutto lo styling
- Usare **shadcn/ui** per i componenti UI (già installati, non reinstallare)
- I componenti in `src/components/ui/` NON vanno modificati - creare nuovi componenti se necessario

### Design Frontend (skill: frontend-design)
- Creare interfacce **distintive** e memorabili, evitando l'estetica generica "AI"
- **Tipografia**: Preferire font caratteristici (Google Fonts: Playfair Display, Space Grotesk, DM Sans, Outfit)
- **Colori**: Palette audaci e coesive, usare CSS variables del tema esistente
- **Animazioni**: Micro-interazioni significative con Tailwind animate o CSS transitions
- **Layout**: Composizioni creative con asimmetria controllata quando appropriato
- Mantenere coerenza con il sistema di tema esistente (admin personalizzabile)

### Best Practices
- TypeScript strict dove possibile
- Componenti funzionali con hooks
- Custom hooks per logica riutilizzabile
- React Query per data fetching
- Zod per validazione schema
- Gestione errori appropriata
- Accessibilità (a11y) nelle interfacce

### Protocollo di Sviluppo

Ogni modifica al codice DEVE seguire questi passi obbligatori:

1. **Implementazione** — Scrivere il codice seguendo le convenzioni del progetto
2. **Debug e Build Check** — Eseguire `npm run build` e risolvere tutti gli errori TypeScript e di compilazione prima di procedere
3. **Guida Test Utente** — Fornire all'utente istruzioni chiare per testare manualmente la modifica:
   - Prerequisiti (dati necessari, stato dell'app)
   - Passi da seguire nell'interfaccia
   - Risultati attesi
   - Edge case da verificare
4. **Aggiornamento Documentazione** — Aggiornare i file di documentazione pertinenti:
   - `CLAUDE.md` se cambiano architettura, struttura file, convenzioni o flussi
   - `docs/dev/` se esiste documentazione tecnica specifica per l'area modificata
   - File di traduzione (`src/locales/`) se vengono aggiunte nuove stringhe UI
5. **Commit** — Solo dopo che build e verifica passano, procedere con il commit

Questo protocollo si applica a TUTTE le modifiche, non solo alle feature principali.

---

## Comandi di Sviluppo

```bash
npm run dev      # Avvia server sviluppo (porta 8080)
npm run build    # Build produzione (TypeScript check + Vite build)
npm run lint     # Esegue ESLint
npm run preview  # Preview build produzione
```

---

## Priorità di Sviluppo

1. **Nuove Funzionalità** - Espandere le capacità della piattaforma
2. **Stabilità e Bug Fix** - Correzione bug e miglioramento affidabilità
3. **Performance** - Ottimizzazione caricamento e reattività
4. **Mobile App** - Migliorare esperienza Capacitor iOS/Android

---

## Flusso Gestione Torneo

Il sistema di gestione torneo segue questo flusso:

1. **Creazione Stagione** (`/admin/seasons/wizard`)
   - Wizard 4 step con salvataggio bozza automatico
   - Componenti in `src/components/admin/season-wizard/`

2. **Generazione Calendario** (`/admin/schedule-generator`)
   - Auto-select stagione e fase
   - Preset scheduling (weekend, infrasettimanali)

3. **Dashboard Torneo** (`/admin/tournament-dashboard`)
   - PhaseCard interattive
   - Chiusura fase e avanzamento

Per dettagli tecnici: `docs/dev/TOURNAMENT_ARCHITECTURE.md`

---

## Event-Based Scheduling

Il generatore calendario (`/admin/schedule-generator`) supporta due modalità:

### Modalità Classica
- Date range (inizio/fine) + giorni permessi della settimana
- Slot orari fissi (es. "20:00, 21:00")
- Tutte le squadre della stagione partecipano

### Modalità Per Evento
- Date specifiche selezionabili singolarmente
- Ogni evento ha: data, orario inizio/fine, campi, squadre partecipanti
- Durata partita e pausa configurabili (in minuti)
- Calcolo automatico slot: `floor((endTime - startTime) / (duration + breakTime))` per campo
- Vincoli intelligenti (opzionali, attivabili via toggle):
  - Evita ripetizioni matchup precedenti
  - Bilancia partite per squadra
  - Evita partite consecutive per stessa squadra
  - Assegnazione arbitri automatica da squadre non in campo

### Colonne DB
- `matches.match_day` (int, nullable) — raggruppa partite per evento (incrementale: 1, 2, 3...)
- `matches.match_duration_minutes` (int, nullable) — durata partita in minuti

### File chiave
- `src/pages/admin/ScheduleGenerator.tsx` — form con mode toggle (Classico / Per Evento)
- `src/components/admin/schedule-generator/EventDateEntry.tsx` — entry singolo evento
- `src/components/admin/schedule-generator/ConstraintToggles.tsx` — toggle vincoli intelligenti
- `src/components/admin/schedule-generator/GenerationStats.tsx` — statistiche post-generazione
- `src/components/admin/schedule-generator/MatchPreviewList.tsx` — anteprima partite raggruppate per data/giornata
- `supabase/functions/match-scheduler/index.ts` — logica generazione (classica + event mode)
- `src/lib/utils.ts` — helper timezone wall-clock (`parseAsLocalTime`, `formatMatchDateLocal`, `toDateTimeLocalInputValue`, `toWallClockUtcIsoString`)

### Convenzioni
- L'edge function distingue la modalità tramite `schedulingMode: 'classic' | 'event'`
- Il match_day è incrementale per evento nell'ordine di creazione
- I vincoli sono opzionali e indipendenti tra loro
- Il codice classico non è stato modificato — le due modalità coesistono
- **Gestione timezone**: L'edge function genera date con suffisso UTC (`+00:00`). Il modello applicativo per `match_date` è **wall-clock locale**: in UI non va fatta conversione timezone implicita con `new Date(...)` per gli orari partita.

#### Helper timezone (quando usare cosa)

| Caso d'uso | Helper | Note |
| --- | --- | --- |
| Visualizzazione data/ora partita in pagine pubbliche/admin | `formatMatchDateLocal(iso, pattern, locale?)` | Preserva l'orario inserito (no shift +1h) |
| Prefill di input `datetime-local` in modifica partita | `toDateTimeLocalInputValue(iso)` | Evita offset in apertura form |
| Serializzazione da data locale (es. import Excel) | `toWallClockUtcIsoString(date)` | Mantiene l'ora wall-clock con suffisso `+00:00` |
| Parsing base senza conversione timezone | `parseAsLocalTime(iso)` | Utility di basso livello |

---

## Database (Supabase)

Entità principali:
- `Competition` - Campionati/tornei
- `Season` - Stagioni con date
- `Team` - Squadre con logo, colori, capitano
- `Player` - Rosa giocatori con bio, posizione, numero
- `Match` - Partite con punteggi, stato, fase
  - `match_day` (int) — raggruppamento per evento
  - `match_duration_minutes` (int) — durata partita in minuti
- `Goal` - Statistiche gol per partita
- `Article` - News con pubblicazione
- `Album/GalleryItem` - Gestione foto
- `Theme` - Personalizzazione branding
- `Sponsor` - Sponsor con logo
- `PlayoffBracket` - Gestione bracket torneo
- `TournamentMode` - Formati torneo con impostazioni

Note operative News:
- Il composer inline della pagina `/news` crea record nella tabella `articles` senza nuove migrazioni DB.
- `title` e `slug` vengono auto-generati lato frontend (`src/lib/news/articleComposer.ts`).
- Flusso publish/draft: `published` mostra subito nel feed pubblico, `draft` resta fuori dal feed pubblico.
- Nessuna modifica RLS aggiuntiva introdotta in questa iterazione.

---

## Skills Installate (skills.sh)

Il progetto utilizza **Agent Skills** da [skills.sh](https://skills.sh/) per migliorare le capacità di sviluppo. Le skills sono installate in `.agents/skills/`.

### Skills Principali per NCL App

| Categoria | Skills | Utilizzo |
|-----------|--------|----------|
| **React** | `vercel-react-best-practices`, `react-patterns`, `react-hook-form-zod` | Pattern e best practices React |
| **Supabase** | `supabase-best-practices` | RLS, Auth, ottimizzazione query |
| **Styling** | `shadcn-ui`, `tailwind-css-patterns`, `tailwind-v4-shadcn` | Design system e componenti |
| **TypeScript** | `typescript-advanced-types`, `typescript-docs` | Tipi avanzati e documentazione |
| **Testing** | `webapp-testing`, `playwright-skill` | Test E2E e unit testing |
| **Quality** | `accessibility`, `core-web-vitals`, `performance`, `seo` | A11y, performance, SEO |
| **Mobile** | `react-native-best-practices` | Pattern per Capacitor/mobile |
| **i18n** | `i18n-localization` | Internazionalizzazione |
| **Documenti** | `xlsx`, `pdf`, `docx` | Import/export file |

### Comandi Skills

```bash
# Aggiungere nuove skills
npx skills add <owner/repo>

# Esempio
npx skills add anthropics/skills
```

---

## Note per lo Sviluppo

- La homepage usa un sistema di widget dinamico configurabile da admin
- Il sistema supporta fasi multiple (regular season, playoff, ecc.)
- Le traduzioni sono in `src/locales/{lang}/translation.json`
- Il tema è personalizzabile via pannello admin (colori, logo, font)
- Import Excel disponibile per giocatori e partite
- Nelle pagine pubbliche `Teams`, `Players`, `Matches` sono stati rimossi i controlli hover "Admin Quick Actions" (icona ingranaggio + bottone Admin) per evitare CTA non operative.
