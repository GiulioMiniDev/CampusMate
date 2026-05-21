# CampusMate

CampusMate e una dashboard web per monitorare in tempo reale la disponibilita delle aule studio universitarie e creare prenotazioni individuali o di gruppo.

## Stack

- Client: Vue 3, Vite, Bootstrap, JavaScript
- Server: Node.js, Express, WebSocket
- Database: MySQL

## Avvio in sviluppo

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
