# Tournament Architecture

Documentazione tecnica del sistema di gestione torneo di NCL App.

---

## Overview

Il sistema torneo usa uno **Strategy Pattern** con handler lazy-loaded, configurazioni di fase dichiarative e generazione partite basata su vincoli.

### Flusso Principale

```
Season Wizard → Season + TournamentMode → Schedule Generator → Match Scheduler (Edge Fn)
                                                                      ↓
Tournament Dashboard ← Phase Status Hook ← Matches (DB) ← Generated Matches
         ↓
Phase Close → Tournament Phase Manager (Edge Fn) → Next Phase Matches
```

---

## Schema Database

### Tabelle Principali

```sql
-- Stagioni
seasons (id, name, competition_id, tournament_mode_id, start_date, end_date)

-- Modalità Torneo (configurazione formato)
tournament_modes (id, name, description, handler_key, settings JSONB)

-- Partite
matches (id, season_id, home_team_id, away_team_id, stage, status, match_date, ...)

-- Bozze Wizard (per utente, RLS)
season_drafts (id, user_id, name, current_step, draft_data JSONB, season_id)
```

### Relazioni

- `seasons.tournament_mode_id` → `tournament_modes.id`
- `matches.season_id` → `seasons.id`
- `season_drafts.user_id` → scoped tramite RLS
- `season_teams` (junction table) → associa squadre a stagioni

---

## Handler Pattern

### Struttura File

```
src/lib/tournament/
├── handler-registry.ts       # Registry factory + metadata
├── schemas.ts                # Zod validation schemas
└── handlers/
    ├── league-only.ts        # Round-robin
    ├── knockout.ts           # Eliminazione diretta
    ├── groups-knockout.ts    # Gironi + Knockout
    ├── swiss-system.ts       # Swiss System
    └── round-robin-final.ts  # Campionato + Finale
```

### TournamentHandler Interface

```typescript
interface TournamentHandler {
  validateSettings(settings: TournamentSettings, teamCount: number): ValidationResult;
  generateMatches(context: MatchGenerationContext): MatchGenerationResult;
  calculateStandings(context: StandingsContext): LeagueTableRow[];
  getNextPhase(context: PhaseContext): PhaseConfig | null;
  getAdvancingTeams(standings: LeagueTableRow[], rules: AdvancementRules): string[];
}
```

### Handler Keys

| Key | Fasi |
|-----|------|
| `league_only` | start → regular_season |
| `knockout` | start → quarter-final → semi-final → third-place_playoff → final |
| `groups_knockout` | start → group_stage → knockout → final |
| `swiss_system` | start → regular_season → poule_a → poule_b → final |
| `round_robin_final` | start → regular_season → semi-final → final |

### PhaseConfig

```typescript
interface PhaseConfig {
  id: string;
  nameKey: string;         // chiave i18n
  order: number;
  matchGeneration: string; // tipo algoritmo
  advancementRules: any;   // regole avanzamento
  isTerminal: boolean;     // true = fase finale
  constraints: any;
}
```

---

## Tipi Settings

Definiti in `src/types/tournament-settings.ts`:

| Tipo | Campi Specifici |
|------|-----------------|
| `LeagueOnlySettings` | doubleRoundRobin |
| `KnockoutSettings` | bracketSize (4\|8\|16\|32), seedingMethod, thirdPlaceMatch, doubleElimination |
| `GroupsKnockoutSettings` | groupCount, teamsPerGroup, advancingPerGroup + knockoutSettings |
| `SwissSystemSettings` | phase1Rounds, snakeSeedingPattern, pouleFormat |
| `RoundRobinFinalSettings` | playoffTeams, playoffFormat, thirdPlaceMatch |

Tutti estendono `BaseStandingsSettings` (pointsPerWin/Draw/Loss, tieBreakers[]).

---

## Come Aggiungere una Nuova Modalità Torneo

### 1. Definire i tipi

In `src/types/tournament-settings.ts`, aggiungi:
```typescript
export interface NewModeSettings extends BaseStandingsSettings {
  // campi specifici
}
```

Aggiungi la key a `TournamentHandlerKey` in `src/types/tournament-handlers.ts`.

### 2. Creare l'handler

Crea `src/lib/tournament/handlers/new-mode.ts`:

```typescript
import { registerHandler } from '../handler-registry';

const handler: TournamentHandler = {
  validateSettings(settings, teamCount) { /* ... */ },
  generateMatches(context) { /* ... */ },
  calculateStandings(context) { /* ... */ },
  getNextPhase(context) { /* ... */ },
  getAdvancingTeams(standings, rules) { /* ... */ },
};

registerHandler('new_mode', handler);
```

### 3. Registrare metadata

In `handler-registry.ts`, aggiungi all'oggetto `HANDLER_METADATA`:

```typescript
new_mode: {
  key: 'new_mode',
  nameKey: 'tournament.modes.newMode.name',
  descriptionKey: 'tournament.modes.newMode.description',
  icon: LucideIcon,
  phases: [
    { id: 'start', nameKey: 'tournament.phases.start', order: 0, ... },
    // ... fasi del torneo
  ],
  defaultSettings: { /* ... */ },
}
```

### 4. Aggiungere schema Zod

In `src/lib/tournament/schemas.ts`:
```typescript
const newModeSchema = z.object({ /* ... */ });
```

E aggiungi al switch di `getSettingsSchemaForHandler()`.

### 5. Aggiungere traduzioni

In `src/locales/{it,en,nl}/translation.json`:
```json
"tournament.modes.newMode": { "name": "...", "description": "..." }
```

### 6. Aggiornare le Supabase Functions

Aggiorna i file in `supabase/functions/`:
- `match-scheduler/index.ts` - algoritmo generazione partite
- `tournament-phase-manager/index.ts` - logica transizione fase

---

## Supabase Edge Functions

### match-scheduler

- **Path**: `supabase/functions/match-scheduler/index.ts`
- **Invocato da**: `ScheduleGenerator.tsx`
- **Input**: `{ dryRun, schedule: { season_id, stage, constraints } }`
- **Output**: `{ success, matches[], total_matches }`
- **Algoritmi**: Round-robin (circle method), bracket generation, Swiss pairing, group assignment
- **Vincoli**: date range, giorni permessi, time slots, venues, distribuzione squadre

### tournament-phase-manager

- **Path**: `supabase/functions/tournament-phase-manager/index.ts`
- **Invocato da**: Tournament Dashboard (chiusura fase)
- **Funzionalità**: Tracking stato fase, valutazione regole avanzamento, determinazione fase successiva, calcolo classifiche

---

## Hooks React Query

| Hook | File | Scopo |
|------|------|-------|
| `useSeasons()` | `use-seasons.ts` | Lista stagioni |
| `useSeasonWithTournamentMode(id)` | `use-seasons.ts` | Stagione con join tournament_modes |
| `useTournamentModes()` | `use-tournament-modes.ts` | Lista modalità torneo |
| `useSeasonDrafts()` | `use-season-drafts.ts` | Bozze wizard (user-scoped) |
| `useSeasonPhaseStatus(seasonId)` | `use-season-phase-status.ts` | Stato fasi in tempo reale |

---

## Componenti UI Chiave

| Componente | Path | Scopo |
|------------|------|-------|
| Season Wizard | `src/components/admin/season-wizard/` | Wizard creazione stagione (4 step) |
| Schedule Generator | `src/pages/admin/ScheduleGenerator.tsx` | Generazione calendario |
| Tournament Dashboard | `src/pages/admin/TournamentDashboard.tsx` | Dashboard gestione fasi |
| Tournament Mode Form | `src/pages/admin/TournamentModeForm.tsx` | CRUD modalità torneo |
| Phase Card | Dentro Tournament Dashboard | Card stato fase con azioni |
