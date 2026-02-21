# User Test Protocol - Mobile Matches Redesign

## Goal

Validare che la nuova UI mobile `/matches` migliori velocita di scansione, riconoscimento stato/score e usabilita complessiva rispetto alla baseline.

## Test setup

- Campione: 5 utenti.
- Profilo:
  - 3 utenti abituati ad app risultati sportivi;
  - 2 utenti occasionali.
- Device target:
  - almeno un device/simulatore 360px;
  - almeno un device/simulatore 390px;
  - almeno un device/simulatore 430px.
- Durata sessione: 15 minuti per utente.
- Modalita: moderato, task-based.

## Tasks

1. Trova la prossima partita della tua squadra.
2. Dimmi il risultato finale piu recente.
3. Individua in meno di 5 secondi se ci sono partite live.
4. Apri il dettaglio di una partita specifica dalla lista.

## Success metrics

1. Task completion rate >= 90%.
2. Tempo mediano task 1 <= 8 secondi.
3. Tempo mediano task 3 <= 5 secondi.
4. Misclick rate <= 10%.
5. SEQ (1-7) medio >= 5.5.
6. Preferenza nuova UI vs baseline >= 70%.

## Data capture template

Compilare una riga per utente:

| User | Device | Task 1 (s) | Task 2 (s) | Task 3 (s) | Task 4 (s) | Completed all tasks | Misclicks | SEQ (1-7) | Preferred UI |
|---|---|---:|---:|---:|---:|---|---:|---:|---|
| U1 | | | | | | | | | |
| U2 | | | | | | | | | |
| U3 | | | | | | | | | |
| U4 | | | | | | | | | |
| U5 | | | | | | | | | |

## Qualitative feedback template

Per ogni utente raccogliere:

- cosa ha funzionato bene;
- punti di confusione;
- elementi visivi poco chiari;
- suggerimenti liberi.

## Results summary (to be filled after sessions)

### Quantitative outcome

- Completion rate: `__%`
- Median task 1: `__s`
- Median task 3: `__s`
- Misclick rate: `__%`
- Average SEQ: `__`
- Preferred new UI: `__%`

### Recurring issues

1. `...`
2. `...`
3. `...`

### Decision

- Go / No-Go: `__`
- Rationale: `__`

## Go / No-Go rule

- **Go** se tutte le metriche critiche sono rispettate.
- **No-Go** se una metrica critica fallisce:
  - avviare mini-iterazione UI;
  - rieseguire test su campione ridotto (min 3 utenti) prima del rilascio.

## Execution note

- Questo documento e il protocollo ufficiale per il sign-off UX del redesign mobile `/matches`.
- L'esecuzione del test richiede sessioni moderate con utenti reali e compilazione della sezione "Results summary".
