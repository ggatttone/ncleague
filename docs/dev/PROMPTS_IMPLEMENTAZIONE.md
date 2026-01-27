# Prompt per Implementazione Piano Torneo

> **Piano di riferimento:** `.claude/plans/silly-doodling-origami.md`

Copia il prompt corrispondente all'inizio di ogni nuova chat.

---

## Indice

| Chat | Fase | Contenuto | Dipende da |
|------|------|-----------|------------|
| [Chat 1](#chat-1-database--hook-bozze) | 1.1 | Database + Hook Bozze | - |
| [Chat 2](#chat-2-wizard-ui-base-step-1-2) | 1.2-1.3 | Wizard UI Step 1-2 | Chat 1 |
| [Chat 3](#chat-3-wizard-step-3-4--completamento) | 1.4 | Wizard Step 3-4 + Success | Chat 2 |
| [Chat 4](#chat-4-edit-mode--lista-bozze) | 1.5 | Edit Mode + Lista Bozze | Chat 3 |
| [Chat 5](#chat-5-post-creation-flow) | 2 | Post-Creation Flow | Chat 4 |
| [Chat 6](#chat-6-smart-calendar-generator) | 3 | Smart Calendar Generator | Chat 5 |
| [Chat 7](#chat-7-enhanced-tournament-dashboard) | 4 | Enhanced Dashboard | Chat 6 |
| [Chat 8](#chat-8-traduzioni--documentazione) | 5 | Traduzioni + Docs | Chat 7 |
| [Chat 9](#chat-9-test-e2e-e-fix-finali) | - | Test E2E + Fix | Chat 8 |

---

## Riepilogo Veloce

```
Chat 1 → Chat 2 → Chat 3 → Chat 4 → Chat 5 → Chat 6 → Chat 7 → Chat 8 → Chat 9
 DB       UI 1-2   UI 3-4   Edit     Post     Calendar  Dashboard  Docs     Test
```

**Prima di ogni chat:**
1. Verifica che la chat precedente sia stata completata con successo
2. Verifica che i test della chat precedente passino
3. Committa le modifiche della chat precedente

---

## Chat 1: Database + Hook Bozze

```
Continuo implementazione piano in `.claude/plans/silly-doodling-origami.md`, **Fase 1.1 - Sistema Salvataggio Bozze**.

### Obiettivo
Creare il sistema di persistenza per le bozze delle stagioni.

### Da implementare

**1. Migrazione Database** (`supabase/migrations/XXXXXX_create_season_drafts.sql`):
```sql
CREATE TABLE season_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  current_step INTEGER DEFAULT 1,
  draft_data JSONB NOT NULL,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE season_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own drafts" ON season_drafts
  FOR ALL USING (auth.uid() = user_id);
```

**2. Tipo TypeScript** in `src/types/database.ts`:
```typescript
interface SeasonDraft {
  id: string;
  user_id: string;
  name: string | null;
  current_step: number;
  draft_data: SeasonDraftData;
  season_id: string | null;
  created_at: string;
  updated_at: string;
}

interface SeasonDraftData {
  basicInfo: { name: string; start_date?: string; end_date?: string; };
  teams: { team_ids: string[]; };
  tournament: { tournament_mode_id?: string; custom_settings?: TournamentModeSettings; use_custom_settings: boolean; };
  completedSteps: number[];
  lastModified: string;
}
```

**3. Hook** `src/hooks/use-season-drafts.ts`:
- `useSeasonDrafts()` - Lista bozze utente corrente
- `useSeasonDraft(id)` - Singola bozza
- `useCreateDraft()` - Mutation per creare
- `useUpdateDraft()` - Mutation per aggiornare
- `useDeleteDraft()` - Mutation per eliminare

Usa pattern esistente in `src/hooks/use-seasons.ts` come riferimento.

### Test da verificare
- [ ] Migrazione applicata senza errori
- [ ] CRUD bozze funziona da console React Query DevTools
- [ ] RLS permette solo bozze dell'utente loggato

### Commit finale
`feat(drafts): add season_drafts table and CRUD hooks`
```

---

## Chat 2: Wizard UI Base (Step 1-2)

```
Continuo implementazione piano in `.claude/plans/silly-doodling-origami.md`, **Fase 1.2-1.3 - Wizard UI Base**.

### Prerequisiti completati
- Tabella `season_drafts` creata
- Hook `use-season-drafts.ts` funzionante

### Obiettivo
Creare struttura wizard e primi 2 step con auto-save.

### Da implementare

**1. WizardContext** (`src/components/admin/season-wizard/WizardContext.tsx`):
- State: currentStep, draftId, formData per tutti gli step
- Auto-save debounced (1s) su cambio step
- Funzioni: nextStep, prevStep, saveAndExit, setStepData

**2. WizardProgress** (`src/components/admin/season-wizard/WizardProgress.tsx`):
- Usa componente Stepper esistente in `src/components/ui/stepper.tsx`
- 4 step: Informazioni, Squadre, Formato, Conferma
- Mostra badge "Bozza salvata" con timestamp se draftId presente

**3. BasicInfoStep** (`src/components/admin/season-wizard/BasicInfoStep.tsx`):
- Campi: nome (required), data inizio, data fine
- Validazione Zod come in SeasonFormAdmin.tsx
- Pulsanti: Annulla, Salva e Esci, Avanti

**4. TeamSelectionStep** (`src/components/admin/season-wizard/TeamSelectionStep.tsx`):
- Riusa MultiSelect da SeasonFormAdmin
- Mostra counter squadre selezionate
- Pulsanti: Indietro, Salva e Esci, Avanti

**5. SeasonWizard page** (`src/pages/admin/SeasonWizard.tsx`):
- Route: `/admin/seasons/wizard/:draftId?`
- Wrappa tutto in WizardProvider
- Renderizza step corrente

**6. Route** in `src/App.tsx`:
```tsx
<Route path="seasons/wizard" element={<SeasonWizard />} />
<Route path="seasons/wizard/:draftId" element={<SeasonWizard />} />
```

### Riferimenti nel codebase
- `src/pages/admin/SeasonFormAdmin.tsx` - Form esistente per campi
- `src/pages/admin/TournamentModeFormAdmin.tsx` - Esempio wizard 3 step
- `src/components/ui/stepper.tsx` - Componente stepper

### Test da verificare
- [ ] Navigazione step 1 → 2 → 1 funziona
- [ ] Auto-save crea bozza al passaggio a step 2
- [ ] URL si aggiorna con draftId
- [ ] "Salva e Esci" salva e torna a /admin/seasons
- [ ] Refresh pagina mantiene dati (carica da bozza)

### Commit finale
`feat(wizard): season wizard with basic info and team selection steps`
```

---

## Chat 3: Wizard Step 3-4 + Completamento

```
Continuo implementazione piano in `.claude/plans/silly-doodling-origami.md`, **Fase 1.4 - Step Torneo e Review**.

### Prerequisiti completati
- WizardContext con auto-save funzionante
- Step 1 e 2 completati

### Obiettivo
Completare wizard con step configurazione torneo e review finale.

### Da implementare

**1. TournamentConfigStep** (`src/components/admin/season-wizard/TournamentConfigStep.tsx`):
- Select modalità torneo (dropdown come SeasonFormAdmin O card visual come TournamentModeFormAdmin)
- Toggle "Personalizza impostazioni"
- Se toggle attivo: mostra TournamentSettingsForm inline (riusa da `src/components/admin/tournament-settings/`)
- Preview fasi che verranno generate (usa `getHandlerPhases` da handler-registry)
- Pulsanti: Indietro, Salva e Esci, Avanti

**2. ReviewStep** (`src/components/admin/season-wizard/ReviewStep.tsx`):
- Riepilogo: nome, date, numero squadre, modalità torneo, fasi
- Lista squadre selezionate (collapsible)
- Warnings se applicabili (es. numero dispari squadre per round-robin)
- Pulsanti: Indietro, Salva e Esci, **Crea Stagione**

**3. Logica creazione in WizardContext**:
```typescript
const publishDraft = async () => {
  // 1. Crea stagione con useCreateSeason
  // 2. Se custom_settings, crea/aggiorna tournament_mode
  // 3. Elimina bozza
  // 4. Naviga a SuccessScreen o /admin/seasons
};
```

**4. SuccessScreen** (`src/components/admin/season-wizard/SuccessScreen.tsx`):
- Messaggio "Stagione creata con successo!"
- Dettagli stagione appena creata
- CTA primaria: "Genera Calendario" → `/admin/schedule-generator?season={id}`
- CTA secondarie: "Vai al Dashboard", "Crea altra stagione"

### Riferimenti
- `src/components/admin/tournament-settings/index.tsx` - Form settings torneo
- `src/lib/tournament/handler-registry.ts` - getHandlerPhases, getDefaultSettings
- `src/hooks/use-tournament-modes.ts` - Lista modalità

### Test da verificare
- [ ] Step 3 mostra modalità torneo disponibili
- [ ] Toggle settings mostra form configurazione
- [ ] Preview fasi corretta per modalità selezionata
- [ ] Step 4 mostra riepilogo completo
- [ ] Click "Crea Stagione" crea record e elimina bozza
- [ ] Redirect a SuccessScreen funziona
- [ ] CTA "Genera Calendario" passa season ID

### Commit finale
`feat(wizard): complete season wizard with tournament config and review`
```

---

## Chat 4: Edit Mode + Lista Bozze

```
Continuo implementazione piano in `.claude/plans/silly-doodling-origami.md`, **Fase 1.5 - Edit Mode**.

### Prerequisiti completati
- Wizard creazione completo e funzionante

### Obiettivo
Permettere modifica stagioni esistenti tramite wizard + mostrare bozze in sospeso.

### Da implementare

**1. Edit Mode in SeasonWizard**:
- Nuova route: `/admin/seasons/:seasonId/edit`
- Se seasonId presente, carica dati stagione esistente
- Crea bozza automaticamente con `season_id` popolato
- Banner: "Stai modificando la stagione [nome]"
- Al salvataggio: `useUpdateSeason` invece di `useCreateSeason`

**2. Warning partite esistenti**:
```typescript
const { data: matches } = useMatches({ season_id: seasonId });
const hasMatches = matches && matches.length > 0;

// In ReviewStep, se hasMatches:
<Alert variant="warning">
  Questa stagione ha {matches.length} partite schedulate.
  <RadioGroup>
    <Radio value="keep">Mantieni partite esistenti</Radio>
    <Radio value="delete">Elimina e rigenera calendario</Radio>
  </RadioGroup>
</Alert>
```

**3. DraftsList** (`src/components/admin/season-wizard/DraftsList.tsx`):
- Lista bozze utente con: nome, data creazione, step corrente
- Azioni: Continua, Elimina
- Usato in SeasonsAdmin

**4. Aggiornare SeasonsAdmin** (`src/pages/admin/SeasonsAdmin.tsx`):
- Sezione "Bozze in sospeso" sopra la tabella (se ci sono bozze)
- Cambiare link "Nuova stagione" → `/admin/seasons/wizard`
- Cambiare link "Modifica" → `/admin/seasons/{id}/edit`

**5. Route** in `src/App.tsx`:
```tsx
<Route path="seasons/:seasonId/edit" element={<SeasonWizard />} />
```

### Test da verificare
- [ ] Click "Modifica" su stagione apre wizard con dati precaricati
- [ ] Modifica crea bozza, non altera originale
- [ ] Warning partite appare se stagione ha match
- [ ] Completamento modifica aggiorna stagione ed elimina bozza
- [ ] "Annulla" in qualsiasi step scarta bozza senza modificare originale
- [ ] Lista bozze in SeasonsAdmin mostra bozze pendenti
- [ ] Click su bozza riprende da step salvato

### Commit finale
`feat(wizard): edit mode and pending drafts list`
```

---

## Chat 5: Post-Creation Flow

```
Continuo implementazione piano in `.claude/plans/silly-doodling-origami.md`, **Fase 2 - Post-Creation Flow**.

### Prerequisiti completati
- Wizard completo con creazione ed edit mode

### Obiettivo
Migliorare l'esperienza post-creazione con quick actions.

### Da implementare

**1. Migliorare SuccessScreen** (già creato):
- Animazione di successo (checkmark)
- Card con dettagli stagione
- 3 CTA ben visibili:
  - Primaria: "Genera Calendario" (bottone grande, colorato)
  - Secondaria: "Vai al Dashboard"
  - Terziaria: "Crea altra stagione"

**2. Quick Actions in SeasonsAdmin**:
Aggiungere colonna azioni con dropdown menu:
```tsx
<DropdownMenu>
  <DropdownMenuItem onClick={() => navigate(`/admin/schedule-generator?season=${s.id}`)}>
    <Calendar className="mr-2 h-4 w-4" />
    Genera Calendario
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => navigate(`/admin/tournament-dashboard?season=${s.id}`)}>
    <LayoutDashboard className="mr-2 h-4 w-4" />
    Dashboard Torneo
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={() => navigate(`/admin/seasons/${s.id}/edit`)}>
    <Pencil className="mr-2 h-4 w-4" />
    Modifica
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-destructive">
    <Trash className="mr-2 h-4 w-4" />
    Elimina
  </DropdownMenuItem>
</DropdownMenu>
```

**3. Badge stato stagione**:
- Calcola stato: "Bozza" | "Da schedulare" | "In corso" | "Completata"
- Mostra badge colorato nella lista

### Riferimenti
- `src/components/ui/dropdown-menu.tsx` - Componente dropdown

### Test da verificare
- [ ] SuccessScreen mostra CTA chiare
- [ ] Click "Genera Calendario" apre scheduler con stagione preselezionata
- [ ] Quick actions dropdown funziona su ogni riga
- [ ] Badge stato mostra correttamente lo stato

### Commit finale
`feat(seasons): post-creation flow and quick actions`
```

---

## Chat 6: Smart Calendar Generator

```
Continuo implementazione piano in `.claude/plans/silly-doodling-origami.md`, **Fase 3 - Smart Calendar Generator**.

### Prerequisiti completati
- Wizard e post-creation flow completi

### Obiettivo
Migliorare ScheduleGenerator con auto-select e presets.

### Da implementare

**1. Auto-select stagione da URL** in `ScheduleGenerator.tsx`:
```typescript
const [searchParams] = useSearchParams();

useEffect(() => {
  const seasonId = searchParams.get('season');
  if (seasonId && !selectedSeasonId) {
    setValue('season_id', seasonId);
  }
}, [searchParams]);
```

**2. Hook useSeasonPhaseStatus** (`src/hooks/use-season-phase-status.ts`):
```typescript
interface PhaseStatus {
  phaseId: string;
  phaseName: string;
  totalMatches: number;
  completedMatches: number;
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed';
}

export function useSeasonPhaseStatus(seasonId: string | undefined) {
  // Query partite per stagione
  // Raggruppa per stage
  // Calcola status per fase
}
```

**3. PhaseStatusBadge** (`src/components/admin/schedule-generator/PhaseStatusBadge.tsx`):
- Badge colorato: pending (grigio), scheduled (blu), in_progress (giallo), completed (verde)

**4. Aggiornare select fase** in ScheduleGenerator:
- Mostra badge status accanto a ogni opzione
- Auto-select prima fase "pending"
- Disabilita fasi già "completed"

**5. SchedulePresets** (`src/components/admin/schedule-generator/SchedulePresets.tsx`):
```typescript
const presets = [
  { id: 'weekend', label: 'Weekend', days: [0, 6], times: ['15:00', '17:00'] },
  { id: 'weeknight', label: 'Infrasettimanali', days: [1,2,3,4], times: ['20:30', '21:30'] },
  { id: 'all', label: 'Tutti i giorni', days: [0,1,2,3,4,5,6], times: ['20:00'] },
];

// Click su preset → popola allowedDays e timeSlots
```

### Test da verificare
- [ ] Arrivo da wizard con ?season=xxx → stagione preselezionata
- [ ] Fasi mostrano badge status
- [ ] Prima fase "pending" auto-selezionata
- [ ] Preset "Weekend" popola Sab/Dom + orari
- [ ] Generazione calendario funziona come prima

### Commit finale
`feat(scheduler): smart calendar generator with auto-select and presets`
```

---

## Chat 7: Enhanced Tournament Dashboard

```
Continuo implementazione piano in `.claude/plans/silly-doodling-origami.md`, **Fase 4 - Enhanced Dashboard**.

### Prerequisiti completati
- Tutto il flusso creazione → calendario funzionante

### Obiettivo
Rendere la dashboard più interattiva e contestuale.

### Da implementare

**1. PhaseCard** (`src/components/admin/tournament-dashboard/PhaseCard.tsx`):
```typescript
interface PhaseCardProps {
  phase: PhaseConfig;
  status: PhaseStatus; // da useSeasonPhaseStatus
  isCurrentPhase: boolean;
  onAction: (action: 'schedule' | 'view' | 'close') => void;
}
```
- Card con: nome fase, progress bar, badge status
- CTA contestuale basata su status:
  - `pending` → "Genera Calendario"
  - `scheduled/in_progress` → "Vedi Partite" + progress
  - `completed` → "Chiudi Fase"

**2. ActionsPanel** (`src/components/admin/tournament-dashboard/ActionsPanel.tsx`):
- Panel fisso in alto con azione principale suggerita
- Testo contestuale: "Prossimo passo: genera calendario per Regular Season"

**3. Refactor TournamentDashboard**:
- Sostituire PhaseVisualizer con grid di PhaseCard
- Aggiungere ActionsPanel
- Mantenere LiveStandings e ClosePhaseDialog esistenti

**4. Auto-select da URL**:
```typescript
const [searchParams] = useSearchParams();
useEffect(() => {
  const seasonId = searchParams.get('season');
  if (seasonId) setSelectedSeason(seasonId);
}, []);
```

### Layout suggerito:
```
┌─────────────────────────────────────────┐
│ ActionsPanel: "Genera calendario..."    │
├─────────────────────────────────────────┤
│ PhaseCard │ PhaseCard │ PhaseCard │ ... │
├─────────────────────────────────────────┤
│ LiveStandings (esistente)               │
└─────────────────────────────────────────┘
```

### Test da verificare
- [ ] PhaseCard mostrano status corretto
- [ ] Click su CTA fase naviga correttamente
- [ ] ActionsPanel mostra azione suggerita
- [ ] Progress bar si aggiorna con partite completate
- [ ] Arrivo da ?season=xxx preseleziona stagione

### Commit finale
`feat(dashboard): interactive phase cards and contextual actions`
```

---

## Chat 8: Traduzioni + Documentazione

```
Continuo implementazione piano in `.claude/plans/silly-doodling-origami.md`, **Fase 5 - Traduzioni e Documentazione**.

### Prerequisiti completati
- Tutte le funzionalità implementate

### Obiettivo
Completare traduzioni e creare documentazione.

### Da implementare

**1. Traduzioni** in `src/locales/{it,en,nl}/translation.json`:

Aggiungi le chiavi del piano per:
- `admin.seasonWizard.*` (title, steps, success, draft, edit)
- `admin.phaseCard.*` (pending, scheduled, inProgress, completed)
- `admin.schedulePresets.*` (weekend, weeknight, all)

**2. Documentazione Admin** (`docs/admin/GUIDA_TORNEO.md`):
- Introduzione al flusso torneo
- Guida passo-passo creazione stagione
- Spiegazione modalità torneo disponibili
- Come generare il calendario
- Come gestire le fasi
- FAQ e troubleshooting

**3. Documentazione Dev** (`docs/dev/TOURNAMENT_ARCHITECTURE.md`):
- Overview architettura tournament handlers
- Schema database (seasons, season_drafts, tournament_modes, matches)
- Come aggiungere nuova modalità torneo
- API Supabase functions (match-scheduler, tournament-phase-manager)
- Diagrammi di flusso

**4. Aggiornare CLAUDE.md**:
Aggiungi sezione:
```markdown
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
```

### Test da verificare
- [ ] Nessuna chiave mancante (warning console)
- [ ] Traduzioni EN e NL complete
- [ ] Documentazione leggibile e accurata

### Commit finale
`docs: complete tournament flow documentation and translations`
```

---

## Chat 9: Test E2E e Fix Finali

```
Eseguo test E2E completo del flusso torneo per identificare e fixare eventuali bug.

### Test Flusso Principale

Esegui manualmente questi step e riporta errori:

1. [ ] Vai a `/admin/seasons` → Click "Nuova Stagione"
2. [ ] Wizard Step 1: inserisci nome e date → Avanti
3. [ ] Wizard Step 2: seleziona 6 squadre → Avanti
4. [ ] Verifica URL contiene draftId
5. [ ] Wizard Step 3: seleziona "Round Robin + Final" → Avanti
6. [ ] Wizard Step 4: verifica riepilogo → "Crea Stagione"
7. [ ] SuccessScreen: click "Genera Calendario"
8. [ ] ScheduleGenerator: verifica stagione preselezionata
9. [ ] Seleziona fase, date, giorni, orari, campi → "Genera Anteprima"
10. [ ] Verifica anteprima → "Salva"
11. [ ] Vai a Dashboard Torneo
12. [ ] Verifica PhaseCard mostra fase schedulata
13. [ ] Inserisci risultato per 1 partita
14. [ ] Verifica standings si aggiorna

### Test Sistema Bozze

1. [ ] Inizia wizard, vai a step 2, click "Salva e Esci"
2. [ ] Verifica bozza in lista SeasonsAdmin
3. [ ] Click su bozza → riprende da step 2
4. [ ] Completa wizard → bozza sparisce dalla lista

### Test Edit Mode

1. [ ] Click "Modifica" su stagione con partite
2. [ ] Verifica warning partite esistenti
3. [ ] Modifica nome → Salva
4. [ ] Verifica stagione aggiornata, partite invariate

### Riporta qui eventuali bug trovati per fixarli.
```

---

## Note per ogni Chat

1. **Inizia sempre** leggendo il piano: `.claude/plans/silly-doodling-origami.md`
2. **Verifica prerequisiti** prima di iniziare
3. **Testa** prima di committare
4. **Committa** con messaggio indicato alla fine del prompt
5. **Aggiorna** CLAUDE.md se necessario

---

## Gestione Errori

### Se una chat fallisce o si blocca

```
Riprendo la chat [N] che si è bloccata.

### Stato attuale
- Ultimo file modificato: [nome file]
- Ultimo test passato: [descrizione]
- Errore riscontrato: [descrizione errore]

### Da completare
[lista delle cose rimanenti dalla chat originale]
```

### Se devi saltare una chat

Non è consigliato, ma se necessario:

```
Salto la Chat [N] per ora. Implemento una versione minimale per sbloccare Chat [N+1].

### Versione minimale richiesta
[descrizione del minimo necessario]
```

### Se devi tornare indietro

```
Devo fare modifiche alla Chat [N-X] già completata.

### Motivo
[perché serve tornare indietro]

### Modifiche necessarie
[lista modifiche]

### Impatto sulle chat successive
[quali chat potrebbero essere impattate]
```

---

## Riferimenti Utili

### File chiave del codebase
- `src/pages/admin/SeasonFormAdmin.tsx` - Form stagione esistente
- `src/pages/admin/TournamentModeFormAdmin.tsx` - Wizard 3 step esempio
- `src/pages/admin/ScheduleGenerator.tsx` - Generatore calendario
- `src/pages/admin/TournamentDashboard.tsx` - Dashboard torneo
- `src/hooks/use-seasons.ts` - Hook CRUD stagioni (pattern da seguire)
- `src/lib/tournament/handler-registry.ts` - Registry modalità torneo

### Componenti UI riutilizzabili
- `src/components/ui/stepper.tsx` - Stepper per wizard
- `src/components/ui/multi-select.tsx` - Multi-select squadre
- `src/components/ui/dropdown-menu.tsx` - Menu dropdown azioni

### Supabase Functions
- `supabase/functions/match-scheduler/` - Generazione calendario
- `supabase/functions/tournament-phase-manager/` - Gestione fasi

---

## Checklist Finale

Dopo aver completato tutte le chat, verifica:

- [ ] `npm run build` passa senza errori
- [ ] `npm run lint` passa senza errori
- [ ] Tutte le traduzioni IT/EN/NL complete
- [ ] Documentazione admin creata
- [ ] Documentazione dev creata
- [ ] CLAUDE.md aggiornato
- [ ] Test E2E completati con successo
- [ ] Tutti i commit hanno messaggi descrittivi

---

## Backup e Recovery

### Prima di iniziare
```bash
git checkout -b feature/season-wizard-flow
```

### Tra una chat e l'altra
```bash
git add .
git commit -m "[messaggio dal prompt]"
```

### Se qualcosa va storto
```bash
git stash                    # Salva modifiche correnti
git log --oneline -5         # Vedi ultimi commit
git reset --soft HEAD~1      # Annulla ultimo commit (mantiene modifiche)
git stash pop                # Ripristina modifiche salvate
```
