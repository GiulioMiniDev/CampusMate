# CampusMate - Design Iniziale

Data: 2026-04-22

## Obiettivo

Impostare la base del progetto `CampusMate` nel rispetto delle specifiche del corso e del file `docs/readme.md`, separando chiaramente la parte client dalla parte server e utilizzando una sola tecnologia backend principale:

- HTML
- CSS
- Bootstrap
- JavaScript
- AJAX/JSON
- Vue.js
- MySQL
- Node.js
- WebSocket

## Approccio Scelto

Tra le possibili soluzioni e stata scelta una struttura monorepo con responsabilita separate:

- `client/` per interfaccia e logica lato browser
- `server/` per API HTTP/JSON, accesso ai dati e notifiche in tempo reale via WebSocket
- `database/` per schema e dati iniziali

Questa impostazione rende semplice spiegare l'architettura durante la presentazione e mantiene distinti:

- il client, responsabile dell'interfaccia e delle interazioni utente
- il server Node.js, responsabile della logica applicativa, del database e del realtime
- il database MySQL, responsabile della persistenza dei dati

## Architettura

### Client

Il client usa:

- Vue.js per organizzare la UI
- Bootstrap per la componente grafica di base
- JavaScript per gestione DOM, richieste AJAX e WebSocket

Responsabilita principali:

- mostrare lo stato della dashboard
- inviare richieste HTTP al backend Node.js
- ricevere eventi live dal server WebSocket

### Server Node.js

Il server Node.js e il punto centrale della logica applicativa:

- espone endpoint JSON
- valida gli input
- legge e scrive sul database MySQL
- prepara i dati per dashboard, aule e prenotazioni

Lo stesso server gestisce anche la parte realtime:

- connessioni WebSocket persistenti
- broadcast di aggiornamenti live
- notifica ai client dei cambiamenti di stato

In questo modo il progetto usa una sola tecnologia backend, evitando duplicazione tra servizi diversi e rendendo piu semplice mantenere coerenti API HTTP, accesso ai dati e notifiche live.

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
  server/
    src/
      config/
      routes/
      services/
      websocket/
    package.json
  database/
    schema.sql
    seed.sql
  docs/
    plans/
```

## Flusso Dati

Flusso iniziale previsto:

1. Il client carica i dati iniziali tramite chiamate HTTP al backend Node.js.
2. Il backend Node.js risponde in JSON ed e l'unico punto che accede al database.
3. Il client apre una connessione WebSocket verso lo stesso server Node.js.
4. Quando cambia lo stato di un'aula o di una prenotazione, il server invia un evento realtime ai client connessi.

## Gestione Errori

Per la base iniziale:

- errori HTTP gestiti nel client con messaggi semplici
- validazione lato server Node.js
- gestione base di connessione, chiusura ed errore WebSocket
- fallback client in caso di backend non raggiungibile

## Testing Iniziale

Per il primo setup e sufficiente verificare:

- caricamento del client
- risposta degli endpoint Node.js di base
- apertura di una connessione WebSocket
- ricezione di un messaggio iniziale dal server realtime

## Scope di Questa Prima Iterazione

Questa iterazione imposta solo la struttura iniziale del progetto:

- scaffolding cartelle
- client Vue + Bootstrap minimale
- server Node.js con endpoint JSON base
- server Node.js con WebSocket minimale
- schema SQL iniziale

Le funzionalita complete di prenotazione, autenticazione e sincronizzazione avanzata saranno sviluppate nelle iterazioni successive.

