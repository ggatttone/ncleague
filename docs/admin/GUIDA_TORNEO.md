# Guida Gestione Torneo

Questa guida spiega come creare e gestire un torneo completo sulla piattaforma NCL App.

---

## Panoramica del Flusso

Il sistema di gestione torneo segue tre fasi principali:

1. **Creazione Stagione** - Wizard guidato per configurare la stagione
2. **Generazione Calendario** - Pianificazione automatica delle partite
3. **Gestione Fasi** - Dashboard per monitorare e avanzare il torneo

---

## 1. Creazione Stagione

### Accesso al Wizard

Vai su **Admin > Stagioni > Nuova Stagione** oppure naviga a `/admin/seasons/wizard`.

### Step del Wizard

#### Step 1: Informazioni Base
- **Nome Stagione**: es. "Stagione 2024/2025"
- **Data Inizio** e **Data Fine**: definiscono il periodo della stagione

#### Step 2: Selezione Squadre
- Seleziona le squadre partecipanti dal menu a tendina
- Puoi saltare questo step e aggiungere squadre successivamente

#### Step 3: Formato Torneo
Scegli tra le modalità disponibili:

| Modalità | Descrizione | Ideale per |
|----------|-------------|------------|
| **Solo Campionato** | Round-robin classico, tutte contro tutte | Piccole leghe (4-10 squadre) |
| **Eliminazione Diretta** | Bracket, una sconfitta elimina | Tornei veloci |
| **Gironi + Playoff** | Fase a gironi seguita da eliminazione | Tornei medio-grandi (8-32 squadre) |
| **Swiss System** | Abbinamenti dinamici basati su classifica | Competizioni bilanciate |
| **Campionato + Finale** | Round-robin + playoff tra migliori | Leghe con finale |

Dopo aver scelto la modalità, puoi personalizzare le impostazioni specifiche (sistema punti, tie-breakers, formato playoff, ecc.).

#### Step 4: Conferma
- Rivedi tutte le informazioni inserite
- Controlla eventuali avvisi (numero squadre dispari, configurazioni non ottimali)
- Clicca **Crea Stagione** per confermare

### Salvataggio Bozza
Il wizard salva automaticamente una bozza. Puoi uscire in qualsiasi momento e riprendere dalla lista bozze.

---

## 2. Generazione Calendario

### Accesso
Vai su **Admin > Generatore Calendario** oppure clicca "Genera Calendario" dalla schermata di successo del wizard.

### Configurazione

1. **Seleziona Stagione e Fase**: il sistema auto-seleziona la stagione appena creata e la prima fase
2. **Giorni permessi**: scegli i giorni della settimana (usa i preset rapidi: Weekend, Infrasettimanali, Tutti)
3. **Orari**: inserisci gli orari disponibili separati da virgola (es. "18:00, 20:00")
4. **Campi**: seleziona i campi da utilizzare
5. **Partite di ritorno**: attiva se vuoi andata e ritorno

### Generazione
1. Clicca **Genera Anteprima** per vedere il calendario proposto
2. Controlla le partite generate nell'anteprima
3. Clicca **Conferma e Salva Calendario** per salvare

---

## 3. Gestione Fasi (Dashboard Torneo)

### Accesso
Vai su **Admin > Dashboard Torneo** oppure naviga a `/admin/tournament-dashboard`.

### PhaseCard
Ogni fase del torneo è rappresentata da una card con:
- **Stato**: In attesa, Programmato, In corso, Completato
- **Numero partite**: totale partite nella fase
- **Azioni**: Genera Calendario, Vedi Partite, Chiudi Fase

### Flusso di Avanzamento

```
Fase 1 (In attesa)
    → Genera Calendario → Fase 1 (Programmata)
    → Gioca partite → Fase 1 (In corso)
    → Chiudi Fase → Fase 1 (Completata)
        → Fase 2 generata automaticamente
```

### Chiusura Fase

La chiusura fase è un processo guidato in 4 step:

1. **Riepilogo Validazione**: controlla eventuali problemi
2. **Gestione Partite Aperte**: per ogni partita non completata, scegli se annullarla, congelarla o inserire il risultato
3. **Risoluzione Parità**: se ci sono squadre a pari punti, trascina per definire l'ordine
4. **Conferma**: rivedi le modifiche e conferma (azione irreversibile)

### Classifica Live
Il pannello laterale mostra la classifica aggiornata in tempo reale con evidenziazione di eventuali avvisi.

---

## FAQ e Troubleshooting

### Posso modificare una stagione dopo averla creata?
Sì, vai su **Stagioni** e clicca il pulsante modifica. Puoi anche usare il wizard per modificare formato e squadre.

### Cosa succede se ho un numero dispari di squadre?
Il sistema genera il calendario con un turno di riposo per una squadra ogni giornata. Un avviso viene mostrato nel wizard.

### Posso rigenerare il calendario?
Sì, ma le partite esistenti dovranno essere gestite. Il wizard chiederà se mantenerle o eliminarle.

### Come aggiungo partite manualmente?
Vai su **Admin > Partite > Nuova Partita** o usa la creazione in blocco per più partite.

### Posso tornare indietro dopo aver chiuso una fase?
No, la chiusura fase è **irreversibile**. Assicurati che tutte le partite siano state giocate o gestite prima di procedere.

### Le classifiche non si aggiornano correttamente
Verifica che:
- Le partite abbiano lo stato "Completata"
- I punteggi siano inseriti correttamente
- La competizione e la stagione siano assegnate alle partite
