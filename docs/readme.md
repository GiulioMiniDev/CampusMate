# CampusMate

CampusMate e una dashboard web per monitorare in tempo reale la disponibilita delle aule studio universitarie e gestire prenotazioni individuali o di gruppo.

## Obiettivo

Rendere visibile, aggiornata e prenotabile la disponibilita delle aule studio con un flusso semplice, affidabile e adatto a mobile.

## Feature chiave

- **Disponibilita realtime**: aggiornamenti live via WebSocket con fallback a refresh periodico se la connessione si interrompe.
- **Prenotazioni guidate**: selezione sede, aula e tavolo con verifica posti e orari in tempo reale.
- **Filtri intelligenti**: ricerca testuale, servizi, orari e fascia di chiusura per ridurre subito il rumore.
- **Accesso sicuro**: login con token e ruoli distinti (student/admin).
- **Mobile first**: layout compatto e navigazione rapida per uso in mobilita.

## Architettura e flusso dati

- **Client**: Vue 3 + Vite per UI reattiva e caricamento rapido.
- **Server**: Node.js + Express per API REST e gestione autenticazione.
- **Realtime**: WebSocket per eventi (prenotazioni, disponibilita).
- **Database**: MySQL per persistenza e query ottimizzate.

Flusso tipico prenotazione:
1) L'utente sceglie la sede e una fascia oraria.
2) Il client verifica disponibilita in tempo reale e mostra i tavoli liberi.
3) Il server applica controlli e lock in transazione per evitare doppie prenotazioni.
4) La creazione emette eventi realtime per aggiornare liste e contatori.

## Scelte tecniche e motivazioni

- **Transazioni e lock**: garantiscono consistenza quando piu utenti prenotano lo stesso tavolo nello stesso slot.
- **Calcolo disponibilita**: basato sui posti residui per tavolo, non solo sul conteggio delle prenotazioni.
- **Time handling coerente**: date salvate in UTC per evitare errori di fuso orario, visualizzate in locale per l'utente.
- **Fallback realtime**: se il WebSocket e down, il client continua ad aggiornare i dati in background.

## Qualita e robustezza

- **Validazioni**: orari coerenti, stessa giornata, capienza e status di aula/tavolo.
- **Edge case**: prenotazioni sovrapposte, slot non disponibili, aule chiuse.
- **UX**: feedback immediato sugli errori e sui posti liberi.

## Criteri progettuali in evidenza

| Area | Scelta progettuale | Perche conta |
| --- | --- | --- |
| Consistenza dati | Prenotazioni create in transazione con lock sul tavolo | Evita doppie prenotazioni e incongruenze in concorrenza. |
| Disponibilita | Calcolo su posti residui per tavolo e fascia oraria | Risultati reali anche con prenotazioni parziali. |
| Orari | Salvataggio in UTC e visualizzazione locale | Coerenza tra backend, DB e client con fusi orari diversi. |
| Realtime | WebSocket con fallback a refresh periodico | L'app resta aggiornata anche se la rete e instabile. |
| UX responsiva | Layout mobile-first e navigazione veloce | Usabilita in mobilita durante la ricerca di aule. |
| Sicurezza base | Token JWT per API e ruoli | Accesso controllato a prenotazioni e funzioni admin. |

## Stack

- Client: Vue 3, Vite, Bootstrap, JavaScript
- Server: Node.js, Express, WebSocket
- Database: MySQL

## Avvio rapido cross-platform

Serve avere installati:

- Docker Desktop
- Node.js
- npm

Da Windows, macOS o Linux:

```bash
node start-campusmate.js
```

Lo script avvia Docker MySQL, importa schema e seed se il database e vuoto, installa le dipendenze, avvia backend e frontend, poi apre l'app.

Opzioni utili:

```bash
node start-campusmate.js --reset-db
node start-campusmate.js --skip-install
node start-campusmate.js --no-browser
```

## Avvio manuale in sviluppo

Avviare prima il backend:

```bash
cd server
npm install
npm start
```

Poi avviare il frontend:

```bash
cd client
npm install
npm run dev
```

Porte predefinite:

- Frontend: `http://localhost:5173`
- API: `http://localhost:8000`
- WebSocket: `ws://localhost:8000`

## Configurazione client

Il client usa variabili Vite. Per cambiare URL di API o WebSocket, copiare `client/.env.example` in `client/.env` e modificare:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_WEBSOCKET_URL=ws://localhost:8000
```

La cartella `client/dist/` viene generata da `npm run build` e non va modificata a mano.

## Login e registrazione

La registrazione crea sempre account con ruolo `student`.

Account demo dopo un reset del database:

- Studente: `mario.rossi@uniroma1.it` / `student123`
- Admin seed: `admin@campusmate.local` / `admin123`

Endpoint principali:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Per leggere o creare prenotazioni il client invia il token con header `Authorization: Bearer <token>`.
