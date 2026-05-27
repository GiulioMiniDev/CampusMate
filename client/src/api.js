import { mutations, state } from "./store.js";

async function makeRequest(method, endpoint, body = null, requireAuth = false) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, `${state.apiBaseUrl}${endpoint}`);
    
    if (body) {
      request.setRequestHeader("Content-Type", "application/json");
    }
    
    if (requireAuth && state.authToken) {
      request.setRequestHeader("Authorization", `Bearer ${state.authToken}`);
    }

    request.onreadystatechange = () => {
      if (request.readyState !== 4) return;

      const isSuccess = request.status >= 200 && request.status < 300;
      let responseData = null;
      let errorMessage = "Errore di rete o del server";

      if (request.responseText) {
        try {
          responseData = JSON.parse(request.responseText);
          errorMessage = responseData?.error?.message || errorMessage;
        } catch {
          errorMessage = `Errore imprevisto dal server: ${request.status}`;
        }
      }

      if (isSuccess) {
        resolve(responseData);
      } else {
        if (request.status === 401 && requireAuth) {
           mutations.logout();
           mutations.setAuthMessage("Sessione scaduta. Effettua di nuovo il login.", "error");
        }
        reject(new Error(errorMessage));
      }
    };

    request.onerror = () => reject(new Error("Network error"));
    request.send(body ? JSON.stringify(body) : null);
  });
}

export const apiService = {
  async register() {
    mutations.setAuthSubmitting(true);
    try {
      const session = await makeRequest("POST", "/api/auth/register", state.registerForm);
      mutations.setAuthSession(session);
      return session;
    } catch (error) {
      mutations.setAuthMessage(error.message || "Registrazione non riuscita.", "error");
      throw error;
    } finally {
      mutations.setAuthSubmitting(false);
    }
  },

  async login() {
    mutations.setAuthSubmitting(true);
    try {
      const session = await makeRequest("POST", "/api/auth/login", state.loginForm);
      mutations.setAuthSession(session);
      return session;
    } catch (error) {
      mutations.setAuthMessage(error.message || "Login non riuscito.", "error");
      throw error;
    } finally {
      mutations.setAuthSubmitting(false);
    }
  },

  async loadCurrentUser() {
    try {
      const response = await makeRequest("GET", "/api/auth/me", null, true);
      mutations.setCurrentUser(response.user);
      return response.user;
    } catch (error) {
      mutations.logout();
      throw new Error(error.message || "Sessione non valida.");
    }
  },

  async loadHealth() {
    try {
      const health = await makeRequest("GET", "/api/health");
      mutations.setHealth(health);
      mutations.setBackendStatus("online");
      return health;
    } catch (error) {
      mutations.setBackendStatus("offline");
      throw error;
    }
  },

  async loadRooms() {
    mutations.setLoadingRooms(true);
    try {
      const rooms = await makeRequest("GET", "/api/rooms");
      mutations.setRooms(rooms);
      mutations.updateStats();
      return rooms;
    } catch (error) {
      throw new Error("Failed to load rooms");
    } finally {
      mutations.setLoadingRooms(false);
    }
  },

  async loadRoomDetail(roomId) {
    try {
      const room = await makeRequest("GET", `/api/rooms/${roomId}`);
      mutations.setSelectedRoomDetail(room);
      return room;
    } catch (error) {
      throw new Error(error.message || "Dettaglio aula non disponibile.");
    }
  },

  async loadReservations() {
    mutations.setLoadingReservations(true);
    mutations.setReservationsMessage(null);
    try {
      const reservations = await makeRequest("GET", "/api/reservations", null, true);
      const data = reservations || [];
      mutations.setReservations(data);
      return data;
    } catch (error) {
      mutations.setReservationsMessage(error.message || "Prenotazioni non disponibili.");
      throw error;
    } finally {
      mutations.setLoadingReservations(false);
    }
  },

  async createReservation(reservationData) {
    mutations.setIsSubmitting(true);
    try {
      const response = await makeRequest("POST", "/api/reservations", reservationData, true);
      mutations.setFormMessage("Prenotazione creata con successo.", "success");
      this.loadReservations().catch((error) => console.error("Reservations reload failed:", error));
      return response;
    } catch (error) {
      mutations.setFormMessage(error.message || "Errore nella prenotazione", "error");
      throw error;
    } finally {
      mutations.setIsSubmitting(false);
    }
  },

  async checkRoomAvailability(form = state.reservationForm) {
    if (!form.room_id || !form.start_time || !form.end_time || !form.seats_requested) {
      mutations.resetAvailabilityCheck();
      return null;
    }

    if (new Date(form.start_time) >= new Date(form.end_time)) {
      mutations.setAvailabilityMessage("Seleziona un orario di fine successivo all'inizio.", "error");
      return null;
    }

    mutations.setAvailabilityLoading(true);

    try {
      const params = new URLSearchParams({
        start_time: form.start_time,
        end_time: form.end_time,
        seats_requested: String(form.seats_requested)
      });

      if (form.study_table_id) {
        params.set("study_table_id", String(form.study_table_id));
      }

      const response = await makeRequest("GET", `/api/rooms/${form.room_id}/availability?${params.toString()}`);
      mutations.setAvailabilityResult(response);
      return response;
    } catch (error) {
      mutations.setAvailabilityMessage(error.message || "Controllo disponibilita non riuscito.", "error");
      throw error;
    } finally {
      mutations.setAvailabilityLoading(false);
    }
  },

  validateReservationForm() {
    const form = state.reservationForm;

    if (!form.start_time) {
      mutations.setFormMessage("Inserisci l'orario di inizio", "error");
      return false;
    }

    if (!form.end_time) {
      mutations.setFormMessage("Inserisci l'orario di fine", "error");
      return false;
    }

    if (new Date(form.start_time) >= new Date(form.end_time)) {
      mutations.setFormMessage("L'orario di fine deve essere dopo quello di inizio", "error");
      return false;
    }

    if (form.seats_requested < 1) {
      mutations.setFormMessage("Il numero di posti deve essere almeno 1", "error");
      return false;
    }

    if (!form.study_table_id) {
      mutations.setFormMessage("Seleziona un tavolo dalla planimetria.", "error");
      return false;
    }

    return true;
  },

  validateLoginForm() {
    const form = state.loginForm;

    if (!form.email) {
      mutations.setAuthMessage("Inserisci la tua email.", "error");
      return false;
    }

    if (!form.password) {
      mutations.setAuthMessage("Inserisci la password.", "error");
      return false;
    }

    return true;
  },

  validateRegisterForm() {
    const form = state.registerForm;

    if (!form.first_name || form.first_name.trim().length < 2) {
      mutations.setAuthMessage("Il nome deve contenere almeno 2 caratteri.", "error");
      return false;
    }

    if (!form.last_name || form.last_name.trim().length < 2) {
      mutations.setAuthMessage("Il cognome deve contenere almeno 2 caratteri.", "error");
      return false;
    }

    if (!form.email) {
      mutations.setAuthMessage("Inserisci la tua email.", "error");
      return false;
    }

    if (!form.password || form.password.length < 8) {
      mutations.setAuthMessage("La password deve contenere almeno 8 caratteri.", "error");
      return false;
    }

    if (form.password !== form.password_confirm) {
      mutations.setAuthMessage("Le password non coincidono.", "error");
      return false;
    }

    if (form.year_of_study) {
      const yearOfStudy = Number(form.year_of_study);

      if (!Number.isInteger(yearOfStudy) || yearOfStudy < 1 || yearOfStudy > 6) {
        mutations.setAuthMessage("L'anno di studio deve essere compreso tra 1 e 6.", "error");
        return false;
      }
    }

    return true;
  }
};
