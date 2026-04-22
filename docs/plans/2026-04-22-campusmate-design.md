# CampusMate - Design Iniziale

Data: 2026-04-22

## Obiettivo

Impostare la base del progetto `CampusMate` nel rispetto delle specifiche del corso e del file `docs/readme.md`, separando chiaramente la parte client dalla parte server e utilizzando le tecnologie studiate:

- HTML
- CSS
- Bootstrap
- JavaScript
- AJAX/JSON
- Vue.js
- PHP
- MySQL
- Node.js
- WebSocket

## Approccio Scelto

Tra le possibili soluzioni e stata scelta una struttura monorepo con responsabilita separate:

- `client/` per interfaccia e logica lato browser
- `server-php/` per API HTTP/JSON e accesso ai dati
- `server-ws/` per notifiche in tempo reale via WebSocket
- `database/` per schema e dati iniziali

Questa impostazione rende semplice spiegare l'architettura durante la presentazione e mantiene distinti:

- il flusso richiesta/risposta gestito da PHP
- il flusso realtime gestito da Node.js

## Architettura

### Client

Il client usa:

- Vue.js per organizzare la UI
- Bootstrap per la componente grafica di base
- JavaScript per gestione DOM, richieste AJAX e WebSocket

Responsabilita principali:

- mostrare lo stato della dashboard
- inviare richieste HTTP al backend PHP
- ricevere eventi live dal server WebSocket

### Server PHP

Il server PHP e il punto centrale della logica applicativa tradizionale:

- espone endpoint JSON
- valida gli input
- legge e scrive sul database MySQL
- prepara i dati per dashboard, aule e prenotazioni

### Server Node/WebSocket

Il servizio Node.js gestisce:

- connessioni WebSocket persistenti
- broadcast di aggiornamenti live
- notifica ai client dei cambiamenti di stato

Nel progetto iniziale non deve duplicare la logica di business di PHP, ma limitarsi alla parte realtime.

### Database

MySQL conserva i dati applicativi:

- utenti
- aule studio
- prenotazioni

## Struttura del Repository

```text
CampusMate/
  client/
    assets/
      css/
      js/
    index.html
  server-php/
    api/
    config/
    lib/
    public/
  server-ws/
    src/
    package.json
  database/
    schema.sql
    seed.sql
  docs/
    plans/
```

## Flusso Dati

Flusso iniziale previsto:

1. Il client carica i dati iniziali tramite chiamate HTTP al backend PHP.
2. Il backend PHP risponde in JSON ed e l'unico punto che accede al database.
3. Il client apre una connessione WebSocket verso il servizio Node.js.
4. Quando cambia lo stato di un'aula o di una prenotazione, il sistema invia un evento realtime ai client connessi.

## Gestione Errori

Per la base iniziale:

- errori HTTP gestiti nel client con messaggi semplici
- validazione lato server PHP
- gestione base di connessione, chiusura ed errore WebSocket
- fallback client in caso di backend non raggiungibile

## Testing Iniziale

Per il primo setup e sufficiente verificare:

- caricamento del client
- risposta degli endpoint PHP di base
- apertura di una connessione WebSocket
- ricezione di un messaggio iniziale dal server realtime

## Scope di Questa Prima Iterazione

Questa iterazione imposta solo la struttura iniziale del progetto:

- scaffolding cartelle
- client Vue + Bootstrap minimale
- server PHP con endpoint JSON base
- server Node.js con WebSocket minimale
- schema SQL iniziale

Le funzionalita complete di prenotazione, autenticazione e sincronizzazione avanzata saranno sviluppate nelle iterazioni successive.

