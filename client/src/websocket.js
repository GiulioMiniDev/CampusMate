import { apiService } from "./api.js";
import { mutations, state } from "./store.js";

export const websocketService = {
  socket: null,
  reconnectTimer: null,
  shouldReconnect: true,

  connect() {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      return;
    }

    this.shouldReconnect = true;
    this.socket = new WebSocket(state.websocketUrl);

    this.socket.addEventListener("open", () => {
      mutations.setSocketStatus("connesso");
      this.send({ type: "hello", source: "client" });
    });

    this.socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);

        const refreshEvents = [
          "reservation.created",
          "reservation_updated",
          "room.availability.changed",
          "room_updated"
        ];

        if (refreshEvents.includes(message.type)) {
          apiService.loadRooms().catch((error) => console.error("Error reloading rooms:", error));
        }
      } catch {
        mutations.addSocketMessage(event.data);
      }
    });

    this.socket.addEventListener("close", () => {
      mutations.setSocketStatus("chiuso");

      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      }
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
    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
};
