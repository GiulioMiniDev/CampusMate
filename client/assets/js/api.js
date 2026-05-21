// API Service - Gestione delle chiamate HTTP
import { state, mutations } from './store.js';

export const apiService = {
  // Health check
  async loadHealth() {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("GET", state.apiBaseUrl + "/api/health");
      
      request.onreadystatechange = () => {
        if (request.readyState !== 4) return;

        if (request.status >= 200 && request.status < 300) {
          const health = JSON.parse(request.responseText);
          mutations.setHealth(health);
          mutations.setBackendStatus("online");
          resolve(health);
          return;
        }

        mutations.setBackendStatus("offline");
        reject(new Error("Health check failed"));
      };
      
      request.onerror = () => {
        mutations.setBackendStatus("offline");
        reject(new Error("Network error"));
      };
      
      request.send();
    });
  },

  // Carica le aule
  async loadRooms() {
    mutations.setLoadingRooms(true);
    
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("GET", state.apiBaseUrl + "/api/rooms");
      
      request.onreadystatechange = () => {
        if (request.readyState !== 4) return;

        mutations.setLoadingRooms(false);

        if (request.status >= 200 && request.status < 300) {
          const rooms = JSON.parse(request.responseText);
          mutations.setRooms(rooms);
          mutations.updateStats();
          resolve(rooms);
          return;
        }

        reject(new Error("Failed to load rooms"));
      };
      
      request.onerror = () => {
        mutations.setLoadingRooms(false);
        reject(new Error("Network error"));
      };
      
      request.send();
    });
  },

  // Crea una prenotazione
  async createReservation(reservationData) {
    mutations.setIsSubmitting(true);
    
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", state.apiBaseUrl + "/api/reservations");
      request.setRequestHeader("Content-Type", "application/json");
      
      request.onreadystatechange = () => {
        if (request.readyState !== 4) return;

        mutations.setIsSubmitting(false);

        if (request.status >= 200 && request.status < 300) {
          const response = JSON.parse(request.responseText);
          mutations.setFormMessage("✅ Prenotazione creata con successo!", "success");
          resolve(response);
          return;
        }

        try {
          const response = JSON.parse(request.responseText);
          const errorMessage = "❌ " + (response.error?.message || "Errore nella prenotazione");
          mutations.setFormMessage(errorMessage, "error");
          reject(new Error(response.error?.message || "Reservation failed"));
        } catch {
          mutations.setFormMessage("❌ Errore: " + request.status, "error");
          reject(new Error("Unknown error"));
        }
      };

      request.onerror = () => {
        mutations.setIsSubmitting(false);
        mutations.setFormMessage("❌ Errore di connessione al server", "error");
        reject(new Error("Network error"));
      };

      request.send(JSON.stringify(reservationData));
    });
  },

  // Valida il form
  validateReservationForm() {
    const form = state.reservationForm;
    
    if (!form.start_time) {
      mutations.setFormMessage("❌ Inserisci l'orario di inizio", "error");
      return false;
    }
    
    if (!form.end_time) {
      mutations.setFormMessage("❌ Inserisci l'orario di fine", "error");
      return false;
    }
    
    if (new Date(form.start_time) >= new Date(form.end_time)) {
      mutations.setFormMessage("❌ L'orario di fine deve essere dopo quello di inizio", "error");
      return false;
    }
    
    if (form.seats_requested < 1) {
      mutations.setFormMessage("❌ Il numero di posti deve essere almeno 1", "error");
      return false;
    }
    
    return true;
  }
};
