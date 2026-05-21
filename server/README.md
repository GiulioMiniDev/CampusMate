# CampusMate server

Backend Node.js per API HTTP/JSON e WebSocket.

## Avvio

1. Copiare `.env.example` in `.env` se servono credenziali MySQL diverse da quelle di default.
2. Creare il database importando `database/schema.sql` e poi `database/seed.sql`.
3. Avviare il server dalla cartella `server/`:

```bash
npm install
npm start
```

Di default il server parte su:

- API: `http://localhost:8000`
- WebSocket: `ws://localhost:8000`

Il frontend Vue + Vite si avvia separatamente dalla cartella `client/`:

```bash
npm install
npm run dev
```

Di default il frontend parte su `http://localhost:5173`.

## Endpoint iniziali

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

La registrazione crea sempre utenti con ruolo `student`. Per leggere o creare prenotazioni serve inviare il token di login con header `Authorization: Bearer <token>`.
