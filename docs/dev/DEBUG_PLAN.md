# Debug Totale NCL App - Prompt Dedicati

Ogni prompt e' autonomo e puo' essere eseguito in una sessione separata.

---

## PROMPT 1: Fix ESLint - React Hook in callback (CRITICO)

```
Fix the React Hooks rule violation in `src/components/GroupStageView.tsx`.

At line 153-156, `useNclStandings` is called inside a `.map()` callback:

  const groupQueries = groups.map((groupId) => {
    const { data, isLoading, error } = useNclStandings(competitionId, seasonId, groupId);
    return { groupId, data, isLoading, error };
  });

This violates React Hooks rules - hooks cannot be called inside callbacks.

FIX: Extract a `GroupTable` sub-component that receives `groupId` as prop and calls `useNclStandings` at its top level. Replace the `.map()` with rendering `<GroupTable>` components. Keep all existing rendering logic intact, just move the per-group logic into the sub-component.

After fixing, run `npm run lint` and verify the `react-hooks/rules-of-hooks` error is gone.
```

---

## PROMPT 2: Fix ESLint - Case block declarations (10 errors)

```
Fix `no-case-declarations` ESLint errors in two files:

**File 1: `src/components/admin/tournament-settings/index.tsx`**
Lines 131, 144, 157, 170, 183 - each `case` block has a `const` declaration without braces.

Wrap the content of each case in `{ }` braces. Example for line 128-140:

  case 'league_only': {
    const leagueSettings: LeagueOnlySettings = isLeagueOnlySettings(settings)
      ? settings
      : DEFAULT_LEAGUE_ONLY_SETTINGS;
    return (
      <LeagueOnlySettingsForm value={leagueSettings} onChange={onChange} disabled={disabled} />
    );
  }

Do the same for cases: 'knockout' (line 142), 'groups_knockout' (line 155), 'swiss_system' (line 168), 'round_robin_final' (line 181).

**File 2: `supabase/functions/tournament-phase-manager/index.ts`**
Lines 499-544 - same issue in switch cases for 'knockout' (line 499), 'swiss_pairing' (line 510), 'group_assignment' (line 528).

Wrap each case body in `{ }` braces.

After fixing, run `npm run lint` and verify all `no-case-declarations` errors are gone (was 10 total).
```

---

## PROMPT 3: Fix Bug #2 + #9 - ScheduleGenerator payload e phase param

```
Fix two high-priority bugs in `src/pages/admin/ScheduleGenerator.tsx`:

**BUG #9 - Phase URL param ignored:**
The TournamentDashboard navigates to `/admin/schedule-generator?season=X&phase=Y` but ScheduleGenerator only reads `season` from searchParams, ignoring `phase`.

1. In the form `defaultValues` (around line 77), add `stage: searchParams.get("phase") || ""`
2. In the useEffect that auto-selects stage (around line 105-116), add a guard: if `searchParams.get("phase")` is set, don't reset stage. Only auto-select when there's no URL phase param.

**BUG #2 - Save mutation payload mismatch:**
The `saveScheduleMutation` (line 159-173) sends `{ dryRun: false, schedule: preview }` where `preview` is an array of match objects. But `generatePreviewMutation` (line 118-157) sends `{ dryRun: true, schedule: { season_id, stage, constraints } }`.

Check the edge function `match-scheduler` (in `supabase/functions/`) to understand the expected contract. Align the save mutation payload to match what the edge function expects. The save likely needs `{ dryRun: false, matches: preview }` or reconstructed params.

After fixing, run `npm run build` to verify no TypeScript errors.
```

---

## PROMPT 4: Fix Bug #3 - Race condition auto-select stage

```
Fix race condition in `src/pages/admin/ScheduleGenerator.tsx` around lines 105-116.

The useEffect that auto-selects the stage re-triggers on every change of `phaseStatusMap` and `availableStages`, which can overwrite the user's manual selection.

Fix: use a ref `lastAutoSelectedSeasonRef` to track the last seasonId that was auto-selected. Only run auto-select logic when selectedSeasonId actually changes (is different from the ref). Also guard against empty availableStages (data not yet loaded).

  const lastAutoSelectedSeasonRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedSeasonId) return;
    if (lastAutoSelectedSeasonRef.current === selectedSeasonId) return;
    if (availableStages.length === 0) return;

    lastAutoSelectedSeasonRef.current = selectedSeasonId;
    const firstPending = availableStages.find(
      phase => !phaseStatusMap.get(phase.id) || phaseStatusMap.get(phase.id)?.status === 'pending'
    );
    setValue("stage", firstPending?.id || "");
  }, [selectedSeasonId, setValue, availableStages, phaseStatusMap]);

NOTE: Check if `lastAutoSelectedSeasonRef` already exists from a previous fix (commit 6d58232). If so, verify the implementation is correct and not still re-triggering.

Run `npm run build` after.
```

---

## PROMPT 5: Fix Bug #4 - SuccessScreen edit mode text

```
Fix UX bug in `src/components/admin/season-wizard/SuccessScreen.tsx`.

After editing a season, the success screen shows "Stagione Creata con Successo!" and a "Nuova" badge. It should distinguish between creation and edit mode.

1. In `src/components/admin/season-wizard/WizardContext.tsx`, find the navigation to success screen (search for `navigate` to `/admin/seasons/wizard/success/`). Append `?mode=edit` when `seasonIdToUpdate` is truthy.

2. In `SuccessScreen.tsx`:
   - Add `const [searchParams] = useSearchParams();` (import from react-router-dom)
   - Add `const isEditMode = searchParams.get('mode') === 'edit';`
   - Change title: `isEditMode ? "Stagione Aggiornata!" : "Stagione Creata con Successo!"`
   - Change badge: `isEditMode ? "Aggiornata" : "Nuova"`
   - Update subtitle text accordingly

Also add i18n keys for both modes in `src/locales/it/translation.json`, `en/translation.json`, `nl/translation.json` if the text uses `t()`.

Run `npm run build` after.
```

---

## PROMPT 6: Fix Auth Context race condition e error handling

```
Fix issues in `src/lib/supabase/auth-context.tsx`:

**Issue 1 - Race condition on mount:**
Lines 105-109: `fetchSessionAndProfile()` is called immediately, then the auth listener (line 107) also calls it on state changes. If auth changes quickly, multiple concurrent fetch calls run.

Fix: Add a guard variable `isFetchingRef = useRef(false)` at the top of `AuthProvider`. At the start of `fetchSessionAndProfile`, check `if (isFetchingRef.current) return;` and set it to true. Set it back to false in a finally block.

**Issue 2 - Error handling:**
Lines 41, 68, 87, 92 use `console.error` without setting error state.
This is acceptable for now, but ensure that when an error occurs:
- `setLoading(false)` is ALWAYS called (line 70 returns early - verify profile/role are cleared)
- Session errors clear all state properly (already done at line 42-46, OK)

**Issue 3 - hasPermission captain logic (line 120-121):**
The captain branch `if (role === 'captain' && teamId) return true;` doesn't validate that the captain belongs to that team. This is a known limitation - add a TODO comment but don't change logic now (would require async DB call).

Run `npm run build` after.
```

---

## PROMPT 7: Sincronizzazione traduzioni

```
Synchronize translation keys across all 3 language files:
- `src/locales/en/translation.json` (1276 lines - baseline)
- `src/locales/it/translation.json` (1306 lines - has extra keys)
- `src/locales/nl/translation.json` (1261 lines - missing keys)

Tasks:
1. Find all keys present in IT but missing in EN and NL. These are likely the "closePhase.steps" section. Add them to EN and NL with English/Dutch translations.
2. Find all keys present in EN but missing in NL. Add them to NL with Dutch translations (use English as fallback if Dutch translation is uncertain, with a // TODO comment).
3. Check for the "groupStageView" section - ensure it exists in all 3 files.

Do NOT remove any existing keys. Only ADD missing ones.

Run `npm run build` after to verify JSON is valid.
```

---

## PROMPT 8: Fix minori hooks e Profile

```
Fix two minor issues:

1. `src/hooks/use-matches.ts`: Find the query key that uses an object like `['matches', { teamId }]`. Change it to `['matches', teamId]` for consistent cache behavior. Also update any `invalidateQueries` calls that reference this key.

2. `src/pages/auth/Profile.tsx` line 58: ESLint warns about `profileForm` missing from useEffect dependency array. Review the useEffect logic - if it should re-run when profileForm changes, add it. If not (likely), add an eslint-disable comment with explanation.

Run `npm run lint` after to verify warnings are reduced.
```

---

## Ordine di Esecuzione

1. **Prompt 1** - React Hook violation (critico, blocca correttezza runtime)
2. **Prompt 2** - Case declarations (10 ESLint errors)
3. **Prompt 3** - ScheduleGenerator payload + phase (alta priorita')
4. **Prompt 4** - Race condition auto-select (media priorita')
5. **Prompt 5** - SuccessScreen edit mode (bassa priorita')
6. **Prompt 6** - Auth context (media priorita')
7. **Prompt 7** - Traduzioni (media priorita')
8. **Prompt 8** - Fix minori (bassa priorita')

## Verifica Finale

Dopo tutti i prompt, eseguire:
```bash
npm run build   # 0 errori TypeScript
npm run lint    # 0 errori ESLint (warning accettabili)
```
