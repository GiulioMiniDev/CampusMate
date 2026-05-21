import { mutations, state } from "./store.js";

function parseJsonResponse(request) {
  if (!request.responseText) return null;

  return JSON.parse(request.responseText);
}

function getErrorMessage(request, fallbackMessage) {
  try {
    const response = parseJsonResponse(request);

    return response?.error?.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

function setAuthHeader(request) {
  if (state.authToken) {
    request.setRequestHeader("Authorization", `Bearer ${state.authToken}`);
  }
}

export const apiService = {
  async register() {
    mutations.setAuthSubmitting(true);

    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", `${state.apiBaseUrl}/api/auth/register`);
      request.setRequestHeader("Content-Type", "application/json");

      request.onreadystatechange = () => {
        if (request.readyState !== 4) return;

        mutations.setAuthSubmitting(false);

        if (request.status >= 200 && request.status < 300) {
          const session = parseJsonResponse(request);
          mutations.setAuthSession(session);
          resolve(session);
          return;
        }

        const errorMessage = getErrorMessage(request, "Registrazione non riuscita.");
        mutations.setAuthMessage(errorMessage, "error");
        reject(new Error(errorMessage));
      };

      request.onerror = () => {
        mutations.setAuthSubmitting(false);
        mutations.setAuthMessage("Errore di connessione al server", "error");
        reject(new Error("Network error"));
      };

      request.send(JSON.stringify(state.registerForm));
    });
  },

  async login() {
    mutations.setAuthSubmitting(true);

    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", `${state.apiBaseUrl}/api/auth/login`);
      request.setRequestHeader("Content-Type", "application/json");

      request.onreadystatechange = () => {
        if (request.readyState !== 4) return;

        mutations.setAuthSubmitting(false);

        if (request.status >= 200 && request.status < 300) {
          const session = parseJsonResponse(request);
          mutations.setAuthSession(session);
          resolve(session);
          return;
        }

        const errorMessage = getErrorMessage(request, "Login non riuscito.");
        mutations.setAuthMessage(errorMessage, "error");
        reject(new Error(errorMessage));
      };

      request.onerror = () => {
        mutations.setAuthSubmitting(false);
        mutations.setAuthMessage("Errore di connessione al server", "error");
        reject(new Error("Network error"));
      };

      request.send(JSON.stringify(state.loginForm));
    });
  },

  async loadCurrentUser() {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("GET", `${state.apiBaseUrl}/api/auth/me`);
      setAuthHeader(request);

      request.onreadystatechange = () => {
        if (request.readyState !== 4) return;

        if (request.status >= 200 && request.status < 300) {
          const response = parseJsonResponse(request);
          mutations.setCurrentUser(response.user);
          resolve(response.user);
          return;
        }

        mutations.logout();
        reject(new Error(getErrorMessage(request, "Sessione non valida.")));
      };

      request.onerror = () => {
        reject(new Error("Network error"));
      };

      request.send();
    });
  },

  async loadHealth() {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("GET", `${state.apiBaseUrl}/api/health`);

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

  async loadRooms() {
    mutations.setLoadingRooms(true);

    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("GET", `${state.apiBaseUrl}/api/rooms`);

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

  async createReservation(reservationData) {
    mutations.setIsSubmitting(true);

    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", `${state.apiBaseUrl}/api/reservations`);
      request.setRequestHeader("Content-Type", "application/json");
      setAuthHeader(request);

      request.onreadystatechange = () => {
        if (request.readyState !== 4) return;

        mutations.setIsSubmitting(false);

        if (request.status >= 200 && request.status < 300) {
          const response = JSON.parse(request.responseText);
          mutations.setFormMessage("Prenotazione creata con successo.", "success");
          resolve(response);
          return;
        }

        try {
          const response = JSON.parse(request.responseText);
          const errorMessage = response.error?.message || "Errore nella prenotazione";
          mutations.setFormMessage(errorMessage, "error");

          if (request.status === 401) {
            mutations.logout();
            mutations.setAuthMessage("Sessione scaduta. Effettua di nuovo il login.", "error");
          }

          reject(new Error(errorMessage));
        } catch {
          mutations.setFormMessage(`Errore: ${request.status}`, "error");
          reject(new Error("Unknown error"));
        }
      };

      request.onerror = () => {
        mutations.setIsSubmitting(false);
        mutations.setFormMessage("Errore di connessione al server", "error");
        reject(new Error("Network error"));
      };

      request.send(JSON.stringify(reservationData));
    });
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
