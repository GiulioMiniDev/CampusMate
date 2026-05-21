# CampusMate

CampusMate e una dashboard web per monitorare in tempo reale la disponibilita delle aule studio universitarie e creare prenotazioni individuali o di gruppo.

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
