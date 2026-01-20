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
- News con sistema di commenti e like
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
│   ├── auth/               # Autenticazione (RequireAuth, AvatarUploader)
│   ├── ui/                 # Componenti shadcn/ui (NON modificare)
│   └── ...                 # Altri componenti feature
├── pages/                  # 54 pagine
│   ├── Index.tsx           # Homepage pubblica
│   ├── admin/              # 40+ pagine admin
│   └── auth/               # Login, Profile
├── hooks/                  # 24 custom hooks (use-matches, use-teams, ecc.)
├── lib/
│   ├── supabase/           # Client e auth context
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

## Database (Supabase)

Entità principali:
- `Competition` - Campionati/tornei
- `Season` - Stagioni con date
- `Team` - Squadre con logo, colori, capitano
- `Player` - Rosa giocatori con bio, posizione, numero
- `Match` - Partite con punteggi, stato, fase
- `Goal` - Statistiche gol per partita
- `Article` - News con pubblicazione
- `Album/GalleryItem` - Gestione foto
- `Theme` - Personalizzazione branding
- `Sponsor` - Sponsor con logo
- `PlayoffBracket` - Gestione bracket torneo
- `TournamentMode` - Formati torneo con impostazioni

---

## Note per lo Sviluppo

- La homepage usa un sistema di widget dinamico configurabile da admin
- Il sistema supporta fasi multiple (regular season, playoff, ecc.)
- Le traduzioni sono in `src/locales/{lang}/translation.json`
- Il tema è personalizzabile via pannello admin (colori, logo, font)
- Import Excel disponibile per giocatori e partite
