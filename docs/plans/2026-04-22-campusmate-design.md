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

L'idea e questa:

- `client/` contiene la parte visibile dall'utente;
- `server/` contiene API, logica applicativa, accesso al database e WebSocket;
- `database/` contiene schema e dati iniziali;
- `docs/` contiene appunti, piani e documentazione.

Nel repository ci sono ancora le vecchie cartelle `server-php/` e `server-ws/`, ma andranno sostituite con la nuova cartella `server/`, visto che abbiamo scelto Node.js come unico backend.

## Come dovrebbe funzionare

1. L'utente apre il client nel browser.
2. Il client chiede al server Node.js l'elenco delle aule.
3. Il server legge i dati da MySQL e risponde in JSON.
4. Il client apre anche una connessione WebSocket.
5. Quando cambia una prenotazione o la disponibilita di un'aula, il server manda un aggiornamento ai client collegati.
6. La dashboard si aggiorna senza dover ricaricare la pagina.

## Client

Il client sara fatto con HTML, CSS, Bootstrap, JavaScript e Vue.js.

Dovra mostrare:

- riepilogo generale delle aule;
- lista o mappa delle aule studio;
- posti totali e posti disponibili;
- stato dell'aula, ad esempio aperta, piena o chiusa;
- form per creare una prenotazione;
- messaggi di caricamento, errore o conferma.

Il client usera AJAX per parlare con le API Node.js e WebSocket per ricevere gli aggiornamenti realtime.

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

Il database MySQL conterra almeno queste tabelle:

- `users`;
- `study_rooms`;
- `reservations`.

Per ora bastano questi dati, poi se serve possiamo aggiungere campi per migliorare la mappa o descrivere meglio le aule.

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

- [ ] Creare la cartella `server/`.
- [ ] Inizializzare `package.json`.
- [ ] Aggiungere gli script per avviare il server.
- [ ] Installare e configurare Express.
- [ ] Preparare la struttura `src/config/`, `src/routes/`, `src/services/`, `src/websocket/`.
- [ ] Configurare la connessione a MySQL.
- [ ] Creare `GET /api/health`.
- [ ] Creare `GET /api/rooms`.
- [ ] Creare `GET /api/rooms/:id`.
- [ ] Creare `GET /api/reservations`.
- [ ] Creare `POST /api/reservations`.
- [ ] Validare i dati ricevuti quando si crea una prenotazione.
- [ ] Controllare che l'aula esista prima di prenotare.
- [ ] Controllare che ci siano abbastanza posti disponibili.
- [ ] Aggiornare i posti disponibili dopo una prenotazione.
- [ ] Restituire errori JSON comprensibili.
- [ ] Configurare CORS se client e server usano porte diverse.
- [ ] Integrare WebSocket nello stesso server Node.js.
- [ ] Mandare un messaggio iniziale quando un client si collega via WebSocket.
- [ ] Mandare un evento realtime quando cambia una prenotazione.
- [ ] Mandare un evento realtime quando cambia la disponibilita di un'aula.
- [ ] Scrivere due righe di istruzioni per avviare il backend.
- [ ] Spostare o sostituire il vecchio codice `server-ws/` nella nuova struttura.
- [ ] Verificare con chiamate manuali che le API rispondano correttamente.

## Task Filippo - Client e interfaccia

- [ ] Sistemare la struttura di `client/`.
- [ ] Preparare `index.html` con Bootstrap e Vue.js.
- [ ] Creare la dashboard iniziale.
- [ ] Mostrare numero totale di aule.
- [ ] Mostrare posti disponibili totali.
- [ ] Mostrare le aule in lista o in una mappa semplice.
- [ ] Mostrare per ogni aula nome, edificio, piano, capienza e posti disponibili.
- [ ] Evidenziare lo stato dell'aula: aperta, piena, chiusa o quasi piena.
- [ ] Creare il form di prenotazione.
- [ ] Nel form inserire aula, orario inizio, orario fine, tipo prenotazione e numero posti.
- [ ] Validare lato client i campi principali.
- [ ] Collegare il caricamento aule a `GET /api/rooms`.
- [ ] Collegare il form a `POST /api/reservations`.
- [ ] Gestire stato di caricamento durante le richieste.
- [ ] Mostrare messaggi di errore se una chiamata fallisce.
- [ ] Mostrare conferma quando una prenotazione va a buon fine.
- [ ] Aprire la connessione WebSocket dal browser.
- [ ] Aggiornare la dashboard quando arriva un evento WebSocket.
- [ ] Mostrare un avviso se il WebSocket non e disponibile.
- [ ] Curare lo stile in `client/assets/css/styles.css`.
- [ ] Controllare che la pagina sia usabile anche da mobile.
- [ ] Fare una prova completa dal browser.

## Task Alessandro - Database, test e documentazione

- [ ] Controllare `database/schema.sql`.
- [ ] Verificare che `users`, `study_rooms` e `reservations` siano sufficienti.
- [ ] Aggiungere vincoli dove servono, ad esempio chiavi esterne e campi obbligatori.
- [ ] Valutare se aggiungere campi utili per la mappa, tipo posizione, descrizione o zona dell'aula.
- [ ] Controllare `database/seed.sql`.
- [ ] Aggiungere piu aule di esempio.
- [ ] Aggiungere utenti di esempio.
- [ ] Aggiungere prenotazioni di esempio, se utili per la demo.
- [ ] Scrivere come creare il database.
- [ ] Scrivere come importare schema e seed.
- [ ] Provare le query principali usate dal server.
- [ ] Verificare che le API restituiscano dati coerenti con il database.
- [ ] Testare il caso aula piena.
- [ ] Testare il caso orario non valido.
- [ ] Testare il caso posti richiesti maggiori della disponibilita.
- [ ] Testare che una prenotazione aggiorni i posti disponibili.
- [ ] Preparare una checklist per la demo finale.
- [ ] Aggiornare la documentazione con porte, comandi e ordine di avvio.
- [ ] Preparare una breve scaletta per spiegare il progetto al professore.

## Task da fare insieme

- [ ] Decidere il formato JSON definitivo delle aule.
- [ ] Decidere il formato JSON definitivo delle prenotazioni.
- [ ] Decidere il formato JSON degli errori.
- [ ] Decidere il formato degli eventi WebSocket.
- [ ] Allineare i nomi dei campi tra database, server e client.
- [ ] Collegare davvero client, server e database.
- [ ] Provare il flusso completo: apro pagina, vedo aule, prenoto, vedo aggiornamento.
- [ ] Eliminare o ignorare le vecchie parti PHP.
- [ ] Eliminare o integrare la vecchia cartella WebSocket separata.
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
