# Mobile Matches Redesign (LiveScore-inspired)

## Overview

Questo documento descrive il redesign mobile della pagina pubblica `/matches` con una UI "lista risultati compatta" ispirata a LiveScore.

Obiettivo: aumentare leggibilita e velocita di scansione su schermi piccoli mantenendo invariata la logica dati e la vista desktop.

## Scope

- In scope: `src/pages/Matches.tsx` per viewport `< 768px`.
- In scope: nuovi componenti UI mobile dedicati.
- Out of scope: admin fixtures, nuove API, nuovi filtri funzionali.

## Rationale (why this solution)

La UI precedente era basata su card spaziose ottimizzate anche per desktop. Su mobile:

- mostrava meno partite above-the-fold;
- rendeva meno immediato il colpo d'occhio su stato e punteggio;
- non rifletteva il pattern "scoreboard list" tipico delle app risultati.

La nuova soluzione usa righe compatte, separatori, gerarchia forte tempo/stato/squadre/punteggio.

## Architecture and files touched

### New components

- `src/components/matches/MobileLivescoreRow.tsx`
  - definisce `MobileLivescoreRowProps`;
  - rendering della singola riga mobile;
  - mapping visuale stato e punteggio;
  - fallback logo.
- `src/components/matches/MobileMatchesList.tsx`
  - wrapper lista con separatori (`divide-y`) e contenitore compatto.

### Page integration

- `src/pages/Matches.tsx`
  - aggiunge `useIsMobile`;
  - mantiene il rendering desktop invariato;
  - usa `MobileMatchesList` solo in mobile;
  - conserva filtri, query e tabs esistenti.

## Visual state mapping

- `scheduled`
  - leading label: orario (`HH:mm`);
  - score: `vs`;
  - tono neutro.
- `ongoing`
  - leading label: stato localizzato;
  - dot live pulsante;
  - score in evidenza verde.
- `completed`
  - leading label: stato localizzato;
  - score finale `home-away`.
- `postponed` / `cancelled`
  - leading label localizzata;
  - score placeholder `--`;
  - tono warning/destructive.

## Accessibility notes

- intera riga cliccabile con `aria-label` descrittivo;
- focus ring visibile (`focus-visible:ring-*`);
- nomi squadra con `truncate` e layout resistente a stringhe lunghe;
- contrasto colori coerente con token tema.

## Baseline and regression checklist

Prima del rollout produzione:

1. acquisire screenshot baseline su `/matches`:
   - 360px, 390px, 430px;
   - tab `upcoming`, `completed`, `final-stage` (se presente).
2. acquisire screenshot after redesign sulle stesse condizioni.
3. verificare non-regressione desktop (`>= 768px`):
   - card layout invariato;
   - filtri e tabs invariati.
4. verifiche funzionali:
   - click riga apre `/matches/:id`;
   - fallback logo visualizzato correttamente;
   - filtro squadra non rompe il rendering mobile.

## Rollout recommendation

1. QA interno + user test (vedi `docs/dev/MATCHES_MOBILE_USER_TEST.md`).
2. rilascio produzione solo se metriche minime rispettate.
3. rollback rapido: revert delle modifiche UI mobile in `Matches.tsx` e componenti `src/components/matches/*`.

## Implementation status

- Stato: implementato in codice su branch `main` locale.
- Verifiche automatiche eseguite:
  - `pnpm test:run` -> passed.
  - `pnpm lint` -> passed (solo warning non bloccanti).
- Verifiche manuali user test: da eseguire con protocollo in `docs/dev/MATCHES_MOBILE_USER_TEST.md` prima del rollout definitivo.
