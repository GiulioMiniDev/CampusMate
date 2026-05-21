// WebSocket Service - Gestione della connessione WebSocket
import { state, mutations } from './store.js';
import { apiService } from './api.js';

export const websocketService = {
  socket: null,
  
  connect() {
    this.socket = new WebSocket(state.websocketUrl);

    this.socket.addEventListener("open", () => {
      mutations.setSocketStatus("connesso");
      this.send({ type: "hello", source: "client" });
    });

    this.socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Se è un evento di aggiornamento, ricarica le aule
        if (message.type === "reservation_updated" || message.type === "room_updated") {
          apiService.loadRooms().catch(err => console.error("Error reloading rooms:", err));
        }
      } catch {
        // Se non è JSON valido, aggiungi ai messaggi di debug
        mutations.addSocketMessage(event.data);
      }
    });

    this.socket.addEventListener("close", () => {
      mutations.setSocketStatus("chiuso");
      // Riconnessione automatica dopo 3 secondi
      setTimeout(() => this.connect(), 3000);
    });

    this.socket.addEventListener("error", () => {
      mutations.setSocketStatus("errore");
    });
  },
  
  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  },
  
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
};
