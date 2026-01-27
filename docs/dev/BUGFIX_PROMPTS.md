# Bugfix Prompts - Tournament Flow

Prompt predefiniti per risolvere i bug identificati nella code review del flusso torneo.
Ogni prompt fa riferimento ai file e righe specifiche da modificare.

---

## BUG #2 — Save mutation payload mismatch (Alta Priorità)

**File:** `src/pages/admin/ScheduleGenerator.tsx` righe 159-173
**Problema:** La `saveScheduleMutation` invia `{ dryRun: false, schedule: preview }` dove `preview` è un array di match objects. Ma la `generatePreviewMutation` invia `{ dryRun: true, schedule: { season_id, stage, constraints } }`. L'edge function potrebbe non gestire entrambi i formati.

```
Apri `src/pages/admin/ScheduleGenerator.tsx`.

La `saveScheduleMutation` (riga 159-173) invia il payload:
  { dryRun: false, schedule: preview }

dove `preview` è l'array di match restituito dalla preview.
La `generatePreviewMutation` (riga 118-157) invia:
  { dryRun: false, schedule: { season_id, stage, constraints } }

Verifica il contratto dell'edge function `match-scheduler` e allinea il payload della save mutation.
Probabilmente il save deve inviare:
  { dryRun: false, matches: preview }
oppure ricostruire il payload originale con i match generati.

Controlla anche la Supabase edge function per confermare il formato atteso.
```

---

## BUG #9 — Phase URL param non letto (Alta Priorità)

**File:** `src/pages/admin/ScheduleGenerator.tsx` righe 55, 77
**Problema:** Il TournamentDashboard naviga a `/admin/schedule-generator?season=X&phase=Y` ma il ScheduleGenerator legge solo `season` dai searchParams, ignorando `phase`.

```
Apri `src/pages/admin/ScheduleGenerator.tsx`.

A riga 77, il form ha defaultValues che leggono solo `searchParams.get("season")`:
  defaultValues: {
    season_id: searchParams.get("season") || undefined,
    allowedDays: [],
    venueIds: [],
    includeReturnGames: true,
  }

Aggiungi anche la lettura del parametro `phase`/`stage`:
  defaultValues: {
    season_id: searchParams.get("season") || undefined,
    stage: searchParams.get("phase") || "",
    allowedDays: [],
    venueIds: [],
    includeReturnGames: true,
  }

Inoltre, nell'useEffect a riga 105-116 che resetta lo stage quando cambia la stagione,
aggiungi un check per NON resettare se il valore viene dall'URL:

  useEffect(() => {
    if (selectedSeasonId) {
      const phaseFromUrl = searchParams.get("phase");
      if (!phaseFromUrl) {
        setValue("stage", "");
        const firstPending = availableStages.find(...);
        if (firstPending) setValue("stage", firstPending.id);
      }
    }
  }, [selectedSeasonId, ...]);

File di contesto: `src/pages/admin/TournamentDashboard.tsx` riga 113 per la navigazione.
```

---

## BUG #3 — Race condition auto-select stage (Media Priorità)

**File:** `src/pages/admin/ScheduleGenerator.tsx` righe 105-116
**Problema:** L'useEffect resetta `stage` a `""` e poi tenta l'auto-select, ma `phaseStatusMap` potrebbe essere ancora vuoto. Inoltre, ogni cambio di `availableStages` o `phaseStatusMap` re-triggera l'effetto, potenzialmente sovrascrivendo la selezione utente.

```
Apri `src/pages/admin/ScheduleGenerator.tsx`.

L'useEffect a riga 105-116 ha queste dipendenze:
  [selectedSeasonId, setValue, availableStages, phaseStatusMap]

Problemi:
1. `setValue("stage", "")` viene eseguito ad ogni cambio di dipendenza
2. `phaseStatusMap` cambia quando i dati arrivano, re-triggerando l'effetto

Soluzione: usa un ref per tracciare l'ultimo seasonId processato ed esegui il reset
solo quando cambia effettivamente la stagione:

  const lastAutoSelectedSeasonRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedSeasonId) return;
    if (lastAutoSelectedSeasonRef.current === selectedSeasonId) return;

    // Attendi che phaseStatusMap sia caricato (non vuoto o abbia fasi)
    if (availableStages.length === 0) return;

    lastAutoSelectedSeasonRef.current = selectedSeasonId;
    const firstPending = availableStages.find(
      phase => !phaseStatusMap.get(phase.id) || phaseStatusMap.get(phase.id)?.status === 'pending'
    );
    setValue("stage", firstPending?.id || "");
  }, [selectedSeasonId, setValue, availableStages, phaseStatusMap]);

File di contesto: stesso file, `useSeasonPhaseStatus` hook per capire quando i dati sono pronti.
```

---

## BUG #5 — Stale `currentStep` in closure (Media Priorità)

**File:** `src/components/admin/season-wizard/WizardContext.tsx` righe 213-219
**Problema:** `setStepData` cattura `currentStep` nella closure. Se chiamato mentre `currentStep` sta cambiando, il debounced save usa il valore stale.

```
Apri `src/components/admin/season-wizard/WizardContext.tsx`.

A riga 213-219, `setStepData` usa `currentStep` dalla closure:

  const setStepData = useCallback(<K extends WizardStepKey>(step: K, data: SeasonDraftData[K]) => {
    setFormData(prev => {
      const updated = { ...prev, [step]: data };
      debouncedSave(updated, currentStep);  // <-- stale
      return updated;
    });
  }, [currentStep, debouncedSave]);

Soluzione: usa un ref per currentStep che è sempre aggiornato:

  const currentStepRef = useRef(currentStep);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);

Poi in setStepData:
  debouncedSave(updated, currentStepRef.current);

E rimuovi `currentStep` dalle dipendenze del useCallback, lasciando solo `debouncedSave`.

Contesto: la funzione `debouncedSave` (riga 192) e `saveDraft` (riga 165) usano
il valore step per impostare `current_step` nel database (1-indexed).
```

---

## BUG #8 — Watch infinite loop risk (Media Priorità)

**File:** `src/components/admin/season-wizard/BasicInfoStep.tsx` righe 46-67
**Problema:** `watch()` restituisce un nuovo oggetto ad ogni render. L'useEffect dipende da `watchedFields` che cambia sempre. Il ref `skipNextWatchUpdate` mitiga dopo reset ma il confronto tra `undefined` e `""` potrebbe causare loop.

```
Apri `src/components/admin/season-wizard/BasicInfoStep.tsx`.

A riga 46, `watch()` senza argomenti restituisce un nuovo oggetto ad ogni render.
L'useEffect a riga 47-67 ha `watchedFields` come dipendenza.

Soluzione più robusta: usa `watch` con callback subscription invece di polling:

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (!name) return; // skip reset events
      if (skipNextWatchUpdate.current) {
        skipNextWatchUpdate.current = false;
        return;
      }

      const { name: n, start_date, end_date } = value;
      if (
        n !== formData.basicInfo.name ||
        (start_date || "") !== formData.basicInfo.start_date ||
        (end_date || "") !== formData.basicInfo.end_date
      ) {
        setStepData("basicInfo", {
          name: n || "",
          start_date: start_date || "",
          end_date: end_date || "",
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, formData.basicInfo, setStepData]);

Rimuovi la riga `const watchedFields = watch();` (riga 46) e il vecchio useEffect.

Contesto: React Hook Form `watch()` supporta un callback che si attiva solo su cambio
effettivo dei valori, eliminando il rischio di re-render infiniti.
```

---

## BUG #4 — SuccessScreen testo errato in edit mode (Bassa Priorità)

**File:** `src/components/admin/season-wizard/SuccessScreen.tsx` righe 63-66, 73
**Problema:** Dopo un edit, la SuccessScreen mostra "Stagione Creata con Successo!" e badge "Nuova". Dovrebbe distinguere tra creazione e modifica.

```
Apri `src/components/admin/season-wizard/SuccessScreen.tsx`.

Il componente non ha modo di sapere se la stagione è stata creata o modificata
perché il WizardProvider è smontato quando si raggiunge questa route.

Soluzione: usa un searchParam `mode=edit` nell'URL di navigazione.

1. In `WizardContext.tsx` riga 324, modifica la navigazione per edit mode:
   navigate(`/admin/seasons/wizard/success/${resultSeason.id}${seasonIdToUpdate ? '?mode=edit' : ''}`, { replace: true });

2. In `SuccessScreen.tsx`, leggi il parametro:
   const [searchParams] = useSearchParams();
   const isEditMode = searchParams.get('mode') === 'edit';

3. Cambia il testo condizionalmente:
   <CardTitle>{isEditMode ? "Stagione Aggiornata!" : "Stagione Creata con Successo!"}</CardTitle>
   <CardDescription>{isEditMode ? "Le modifiche sono state salvate" : "La nuova stagione è pronta..."}</CardDescription>

4. Cambia il badge:
   <Badge variant="secondary">{isEditMode ? "Aggiornata" : "Nuova"}</Badge>

Importa `useSearchParams` da react-router-dom (già disponibile).
```

---

## BUG #6 — completedSteps mai aggiornato (Bassa Priorità)

**File:** `src/components/admin/season-wizard/WizardContext.tsx` righe 221-230
**Problema:** `nextStep` avanza il currentStep e salva il draft, ma non aggiorna `formData.completedSteps` con lo step appena completato.

```
Apri `src/components/admin/season-wizard/WizardContext.tsx`.

A riga 221-230, la funzione `nextStep`:

  const nextStep = useCallback(async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    await saveDraft(formData, currentStep + 1);
    setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  }, [formData, currentStep, saveDraft]);

Non aggiorna `completedSteps` in `formData`.

Soluzione: aggiorna formData prima di salvare:

  const nextStep = useCallback(async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    const stepKey = WIZARD_STEPS[currentStep].key;
    const updatedData = {
      ...formData,
      completedSteps: formData.completedSteps.includes(stepKey)
        ? formData.completedSteps
        : [...formData.completedSteps, stepKey],
      lastModified: new Date().toISOString(),
    };
    setFormData(updatedData);
    await saveDraft(updatedData, currentStep + 1);
    setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  }, [formData, currentStep, saveDraft]);

Contesto: `WizardProgress` (WizardProgress.tsx) potrebbe usare `completedSteps`
per mostrare quali step sono stati completati nella barra di progresso.
```

---

## Ordine di Esecuzione Consigliato

1. BUG #2 + #9 (ScheduleGenerator - alta priorità, stesso file)
2. BUG #3 (ScheduleGenerator - stesso file, media priorità)
3. BUG #5 + #6 (WizardContext - media/bassa, stesso file)
4. BUG #8 (BasicInfoStep - media priorità)
5. BUG #4 (SuccessScreen + WizardContext - bassa priorità)
6. `npm run build` per verificare TypeScript
