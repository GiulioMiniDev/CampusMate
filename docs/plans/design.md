# CampusMate - Impostazione iniziale del progetto

Data: 2026-04-22

## Introduzione

In questo documento raccogliamo le scelte iniziali per lo sviluppo di `CampusMate`, il progetto che vogliamo realizzare per il corso di Tecnologie e Sistemi Web.

L'idea di partenza e costruire una piattaforma web per la gestione delle aule studio universitarie, con una dashboard che mostri la disponibilita dei posti, una parte di prenotazione e un aggiornamento il piu possibile in tempo reale.

Dato che il progetto deve rispettare le tecnologie viste a lezione, abbiamo deciso di usare solo strumenti coerenti con il materiale del corso, senza aggiungere framework o librerie esterne non necessarie.

## Tecnologie che vogliamo usare

Per il progetto abbiamo deciso di includere tutte le tecnologie principali studiate durante il corso:

- HTML
- CSS
- Bootstrap
- JavaScript
- AJAX e JSON
- Vue.js
- PHP
- MySQL
- Node.js
- WebSocket

L'obiettivo non e usare queste tecnologie in modo forzato, ma assegnare a ciascuna un ruolo preciso dentro l'architettura del progetto.

## Idea generale dell'architettura

La scelta che ci e sembrata piu chiara e dividere il progetto in parti separate, in modo da distinguere bene il client dal server e da rendere piu semplice anche la spiegazione durante la presentazione.

La struttura che vogliamo usare e questa:

- `client/` per tutta la parte eseguita nel browser
- `server-php/` per le API e la logica applicativa classica
- `server-ws/` per la comunicazione realtime tramite WebSocket
- `database/` per schema SQL e dati iniziali

Questa divisione ci sembra utile soprattutto per due motivi:

- evita di mischiare codice frontend e backend
- rende piu evidente la differenza tra richieste HTTP normali e aggiornamenti realtime

## Ruolo del client

Nel client vogliamo costruire l'interfaccia dell'applicazione usando `Vue.js` e `Bootstrap`.

`Vue` ci serve per organizzare meglio componenti, stato e aggiornamento dinamico della pagina, mentre `Bootstrap` ci aiuta a ottenere da subito un'interfaccia ordinata e responsive senza perdere troppo tempo nella fase iniziale.

Il client avra queste responsabilita principali:

- mostrare dashboard, aule e prenotazioni
- inviare richieste AJAX al backend PHP
- ricevere aggiornamenti in tempo reale dal server WebSocket

## Ruolo del server PHP

Abbiamo deciso di lasciare a `PHP` tutta la parte tradizionale lato server.

In pratica, il server PHP dovra:

- esporre endpoint che restituiscono dati in JSON
- validare i dati ricevuti dal client
- leggere e scrivere su MySQL
- gestire la logica di aule, disponibilita e prenotazioni

Ci e sembrato il modo piu lineare per usare PHP nel progetto, anche perche e molto coerente con quanto visto nel corso sul modello richiesta/risposta.

## Ruolo del server Node.js con WebSocket

Per la parte realtime vogliamo usare `Node.js` insieme alle `WebSocket`.

L'idea e che questo servizio non gestisca tutta la logica applicativa, ma solo la comunicazione live con i client connessi. Quindi il suo compito principale sara notificare velocemente cambiamenti come:

- aggiornamento dello stato di un'aula
- variazione dei posti disponibili
- conferma di una nuova prenotazione

In questo modo teniamo separati due flussi diversi:

- `PHP` per il normale scambio HTTP
- `Node.js` per gli eventi realtime

## Database

Per il database abbiamo scelto `MySQL`, che e coerente con gli strumenti citati nel materiale del corso e comodo da usare in ambiente Windows, ad esempio con XAMPP.

Nel database vogliamo mantenere almeno queste entita iniziali:

- utenti
- aule studio
- prenotazioni

Successivamente potremo aggiungere altri dettagli, ma per la prima fase ci basta una base semplice e chiara.

## Struttura del repository

La struttura iniziale prevista e la seguente:

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

Secondo noi questa organizzazione e abbastanza pulita da permettere a tutti e tre di lavorare in parallelo senza confonderci troppo sui ruoli delle varie cartelle.

## Flusso previsto dei dati

Il funzionamento di base che immaginiamo e questo:

1. Il client carica i dati iniziali facendo richieste HTTP al server PHP.
2. Il server PHP recupera o aggiorna le informazioni nel database MySQL e risponde in JSON.
3. Il client apre anche una connessione WebSocket verso il server Node.js.
4. Quando c'e un cambiamento importante, i client ricevono un aggiornamento live senza dover ricaricare la pagina.

Questa soluzione ci sembra adatta al tipo di progetto, perche la dashboard delle aule studio ha senso soprattutto se riesce a mostrare dati aggiornati rapidamente.

## Gestione iniziale degli errori

Per la prima versione non vogliamo complicare troppo la gestione degli errori, ma impostare almeno i controlli essenziali:

- messaggi semplici sul client se una richiesta HTTP fallisce
- validazione lato server PHP
- gestione di apertura, chiusura ed errore della connessione WebSocket
- comportamento di fallback se un servizio non e raggiungibile

## Verifiche iniziali

Nella prima fase ci basta controllare che la base tecnica del progetto funzioni. In particolare vogliamo verificare:

- caricamento corretto del client
- risposta di un endpoint PHP semplice
- connessione al server WebSocket
- ricezione di almeno un messaggio realtime di test

## Scope della prima iterazione

In questa prima iterazione vogliamo arrivare soltanto a una base funzionante del progetto, senza sviluppare ancora tutte le funzionalita finali.

Quindi per ora il lavoro comprende:

- creazione della struttura delle cartelle
- setup iniziale del client con Vue e Bootstrap
- setup iniziale del backend PHP
- setup iniziale del servizio Node.js con WebSocket
- definizione dello schema SQL iniziale

Le funzionalita complete, come autenticazione, prenotazioni complete, gestione gruppi e sincronizzazione piu avanzata, verranno affrontate dopo avere consolidato questa struttura di partenza.
