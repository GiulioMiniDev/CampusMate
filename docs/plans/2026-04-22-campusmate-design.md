# CampusMate - piano iniziale

Data: 2026-04-22

## Idea del progetto

CampusMate e una dashboard web per vedere in tempo reale quanta disponibilita c'e nelle aule studio dell'universita e per prenotare una sessione di studio, sia individuale che di gruppo.

L'obiettivo non e fare subito un'app enorme, ma costruire una base fatta bene:

- una pagina client chiara e usabile;
- un backend unico in Node.js;
- un database MySQL con aule, utenti e prenotazioni;
- aggiornamenti realtime tramite WebSocket.

Per il backend usiamo Node.js, cosi teniamo API e WebSocket nello stesso ambiente e il progetto resta piu semplice da gestire.

## Tecnologie che useremo

- HTML
- CSS
- Bootstrap
- JavaScript
- AJAX/JSON
- Vue.js
- Node.js
- WebSocket
- MySQL

## Struttura generale

Abbiamo scelto una struttura semplice, divisa per responsabilita:

```text
CampusMate/
  client/
    src/
      components/
      App.vue
      main.js
      api.js
      store.js
      websocket.js
      styles.css
    index.html
    package.json
    vite.config.js
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

L'idea e questa:

- `client/` contiene la parte visibile dall'utente;
- `server/` contiene API, logica applicativa, accesso al database e WebSocket;
- `database/` contiene schema e dati iniziali;
- `docs/` contiene appunti, piani e documentazione.

La parte backend viene raccolta dentro `server/`, cosi API e WebSocket stanno nello stesso punto.

## Come dovrebbe funzionare

1. L'utente apre il client nel browser.
2. Il client chiede al server Node.js l'elenco delle aule.
3. Il server legge i dati da MySQL e risponde in JSON.
4. Il client apre anche una connessione WebSocket.
5. Quando cambia una prenotazione o la disponibilita di un'aula, il server manda un aggiornamento ai client collegati.
6. La dashboard si aggiorna senza dover ricaricare la pagina.

## Client

Il client sara fatto con Vue.js, Vite, HTML, CSS, Bootstrap e JavaScript.

Dovra mostrare:

- riepilogo generale delle aule;
- lista o mappa delle aule studio;
- posti totali e posti disponibili;
- stato dell'aula, ad esempio aperta, piena o chiusa;
- form per creare una prenotazione;
- messaggi di caricamento, errore o conferma.

Il client usera AJAX per parlare con le API Node.js e WebSocket per ricevere gli aggiornamenti realtime.

### Migrazione client a Vue + Vite

Dal 2026-05-21 il client viene migrato da Vue caricato via CDN a un progetto Vue + Vite separato dentro `client/`.

La separazione scelta e:

```text
CampusMate/
  client/   # app Vue + Vite
  server/   # API Express + WebSocket
```

Decisioni:

- `client/package.json` contiene gli script del frontend.
- `client/src/App.vue` contiene la dashboard e il form di prenotazione.
- `client/src/components/` contiene i componenti riutilizzabili della dashboard.
- `client/src/main.js` monta l'app Vue.
- `client/src/store.js`, `client/src/api.js` e `client/src/websocket.js` mantengono la logica gia esistente.
- `client/.env.example` documenta gli URL configurabili di API e WebSocket.
- Il server Express resta invariato e continua a rispondere su `http://localhost:8000`.
- In sviluppo il client Vite partira su `http://localhost:5173` e parlera con il backend tramite CORS gia attivo.

## Server Node.js

Il server Node.js sara il backend principale del progetto.

Dovra occuparsi di:

- esporre API HTTP/JSON;
- validare i dati ricevuti dal client;
- leggere e scrivere su MySQL;
- creare prenotazioni;
- aggiornare i posti disponibili;
- gestire gli errori in modo chiaro;
- mandare eventi WebSocket ai client collegati.

In questo modo abbiamo un solo backend da spiegare, avviare e mantenere.

## Database

Il database MySQL conterra queste tabelle principali:

- `users`;
- `buildings`;
- `study_rooms`;
- `study_tables`;
- `reservations`.

La struttura scelta e:

```text
buildings
  1 -> N study_rooms
          1 -> N study_tables
                  N <-> M users
                       tramite reservations
```

In pratica un edificio contiene piu aule studio, ogni aula contiene piu tavoli e le prenotazioni collegano utenti e tavoli. `reservations` e quindi la tabella ponte tra `users` e `study_tables`, con orario di inizio, orario di fine, tipo di prenotazione, numero di posti richiesti e stato.

Questo permette di gestire la disponibilita reale a livello di tavolo, invece di tenere solo una capienza generica sull'aula.

## Errori da gestire

Per la prima versione vogliamo gestire almeno questi casi:

- server non raggiungibile;
- database non raggiungibile;
- aula piena;
- prenotazione con orari non validi;
- numero di posti richiesto maggiore della disponibilita;
- WebSocket scollegato o non disponibile.

Non serve fare una gestione perfetta di ogni caso, ma almeno evitare che l'app si blocchi senza spiegare nulla.

## Prima versione da consegnare

La prima versione deve permettere di:

- aprire il client;
- vedere le aule dal database;
- creare una prenotazione base;
- aggiornare i posti disponibili;
- ricevere almeno un aggiornamento realtime via WebSocket;
- avviare il progetto seguendo la documentazione.

Le parti piu avanzate, come login completo, permessi e gestione dettagliata degli utenti, possono arrivare dopo.

## Divisione del lavoro

Secondo noi ha senso dividerci cosi:

- Giulio: backend Node.js, API, WebSocket e logica applicativa;
- Filippo: client, interfaccia, dashboard e collegamento AJAX/WebSocket lato browser;
- Alessandro: database, dati iniziali, test, documentazione e supporto all'integrazione.

La divisione non significa che ognuno lavora isolato. Alla fine le parti devono tornare insieme, quindi i nomi dei campi, gli endpoint e il formato dei dati vanno concordati.

## Task Giulio - Server Node.js

- [x] Creare la cartella `server/`.
- [x] Inizializzare `package.json`.
- [x] Aggiungere gli script per avviare il server.
- [x] Installare e configurare Express.
- [x] Preparare la struttura `src/config/`, `src/routes/`, `src/services/`, `src/websocket/`.
- [x] Configurare la connessione a MySQL.
- [x] Creare `GET /api/health`.
- [x] Creare `GET /api/rooms`.
- [x] Creare `GET /api/rooms/:id`.
- [x] Creare `GET /api/reservations`.
- [x] Creare `POST /api/reservations`.
- [x] Validare i dati ricevuti quando si crea una prenotazione.
- [x] Controllare che l'aula esista prima di prenotare.
- [x] Controllare che ci siano abbastanza posti disponibili.
- [x] Aggiornare i posti disponibili dopo una prenotazione.
- [x] Restituire errori JSON comprensibili.
- [x] Configurare CORS se client e server usano porte diverse.
- [x] Integrare WebSocket nello stesso server Node.js.
- [x] Mandare un messaggio iniziale quando un client si collega via WebSocket.
- [x] Mandare un evento realtime quando cambia una prenotazione.
- [x] Mandare un evento realtime quando cambia la disponibilita di un'aula.
- [x] Scrivere due righe di istruzioni per avviare il backend.
- [x] Tenere API e WebSocket dentro la stessa struttura `server/`.
- [x] Verificare con chiamate manuali che le API rispondano correttamente con MySQL acceso.

## Task Filippo - Client e interfaccia

- [x] Sistemare la struttura di `client/`.
- [x] Preparare `index.html` con Bootstrap e Vue.js.
- [x] Creare la dashboard iniziale.
- [x] Mostrare numero totale di aule.
- [x] Mostrare posti disponibili totali.
- [x] Mostrare le aule in lista o in una mappa semplice.
- [x] Mostrare per ogni aula nome, edificio, piano, capienza e posti disponibili.
- [x] Evidenziare lo stato dell'aula: aperta, piena, chiusa o quasi piena.
- [x] Creare il form di prenotazione.
- [x] Nel form inserire aula, orario inizio, orario fine, tipo prenotazione e numero posti.
- [x] Validare lato client i campi principali.
- [x] Collegare il caricamento aule a `GET /api/rooms`.
- [x] Collegare il form a `POST /api/reservations`.
- [x] Gestire stato di caricamento durante le richieste.
- [x] Mostrare messaggi di errore se una chiamata fallisce.
- [x] Mostrare conferma quando una prenotazione va a buon fine.
- [x] Aprire la connessione WebSocket dal browser.
- [x] Aggiornare la dashboard quando arriva un evento WebSocket.
- [x] Mostrare un avviso se il WebSocket non e disponibile.
- [x] Curare lo stile in `client/src/styles.css`.
- [x] Controllare che la pagina sia usabile anche da mobile.
- [x] Fare una prova completa dal browser.

## Task Alessandro - Database, test e documentazione

- [x] Controllare `database/schema.sql`.
- [x] Verificare che `users`, `buildings`, `study_rooms`, `study_tables` e `reservations` siano sufficienti.
- [x] Aggiungere vincoli dove servono, ad esempio chiavi esterne e campi obbligatori.
- [x] Valutare se aggiungere campi utili per la mappa, tipo posizione, descrizione o zona dell'aula.
- [x] Controllare `database/seed.sql`.
- [x] Aggiungere piu aule di esempio.
- [x] Aggiungere utenti di esempio.
- [x] Aggiungere prenotazioni di esempio, se utili per la demo.
- [x] Scrivere come creare il database.
- [x] Scrivere come importare schema e seed.
- [x] Provare le query principali usate dal server.
- [x] Verificare che le API restituiscano dati coerenti con il database.
- [x] Testare il caso aula piena.
- [x] Testare il caso orario non valido.
- [x] Testare il caso posti richiesti maggiori della disponibilita.
- [x] Testare che una prenotazione aggiorni i posti disponibili.
- [x] Preparare una checklist per la demo finale.
- [x] Aggiornare la documentazione con porte, comandi e ordine di avvio.
- [x] Preparare una breve scaletta per spiegare il progetto al professore.

## Task da fare insieme

- [ ] Decidere il formato JSON definitivo delle aule.
- [ ] Decidere il formato JSON definitivo delle prenotazioni.
- [ ] Decidere il formato JSON degli errori.
- [ ] Decidere il formato degli eventi WebSocket.
- [ ] Allineare i nomi dei campi tra database, server e client.
- [ ] Collegare davvero client, server e database.
- [ ] Provare il flusso completo: apro pagina, vedo aule, prenoto, vedo aggiornamento.
- [ ] Controllare che il backend usato nella demo sia solo quello dentro `server/`.
- [ ] Controllare che API e WebSocket siano gestiti dallo stesso server Node.js.
- [ ] Controllare che il progetto parta da zero seguendo solo la documentazione.
- [ ] Fare una revisione finale dei file.
- [ ] Preparare una demo breve ma funzionante.
- [ ] Verificare che il progetto rispetti la scelta full Node.js.

## Ordine consigliato

1. Alessandro sistema database e dati iniziali.
2. Giulio prepara server Node.js e collegamento a MySQL.
3. Filippo prepara il client anche con dati temporanei.
4. Giulio espone API e WebSocket.
5. Filippo collega il client alle API vere.
6. Alessandro prova i casi principali e aggiorna la documentazione.
7. Tutti insieme facciamo integrazione finale e demo.

## Note per noi

- Meglio non complicare troppo la prima versione.
- Prima facciamo funzionare bene il flusso base, poi aggiungiamo dettagli.
- Se una cosa non serve per la demo o per le richieste del corso, la lasciamo per dopo.
- La cosa piu importante e riuscire a spiegare chiaramente architettura, database, API e WebSocket.
