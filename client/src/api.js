import { mutations, state } from "./store.js";

function getLocalDatePart(value) {
  return value ? String(value).slice(0, 10) : "";
}

function getCurrentMinute() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}

function getTimeMinutes(value) {
  const match = String(value || "").match(/(\d{1,2})[:.](\d{2})/);

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function getTimeRangeMinutes(text) {
  const matches = String(text || "").match(/\d{1,2}[:.]\d{2}/g);

  if (!matches || matches.length < 2) {
    return null;
  }

  return {
    opens: getTimeMinutes(matches[0]),
    closes: getTimeMinutes(matches[1])
  };
}

function getRoomForReservation(form) {
  if (state.selectedRoomDetail?.id === form.room_id) {
    return state.selectedRoomDetail;
  }

  return state.rooms.find((room) => room.id === form.room_id) || null;
}

function getOpeningWindow(form) {
  const room = getRoomForReservation(form);
  const datePart = getLocalDatePart(form.start_time);

  if (!room || !datePart) {
    return null;
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    const weekendHours = room.weekend_hours || "";
    const normalizedWeekend = weekendHours.toLowerCase();

    if (!weekendHours || normalizedWeekend.includes("chiuso")) {
      return { closed: true };
    }

    if (dayOfWeek === 6 && normalizedWeekend.includes("domenica") && !normalizedWeekend.includes("sabato")) {
      return { closed: true };
    }

    if (dayOfWeek === 0 && normalizedWeekend.includes("sabato") && !normalizedWeekend.includes("domenica")) {
      return { closed: true };
    }

    return getTimeRangeMinutes(weekendHours) || getDefaultOpeningWindow(room);
  }

  return getTimeRangeMinutes(room.weekday_hours) || getDefaultOpeningWindow(room);
}

function getDefaultOpeningWindow(room) {
  const opens = getTimeMinutes(room.opening_time);
  const closes = getTimeMinutes(room.closing_time);

  if (opens === null || closes === null) {
    return null;
  }

  return { opens, closes };
}

function formatMinutes(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");

  return `${hours}:${mins}`;
}

function validateOpeningWindow(form, setMessage) {
  const window = getOpeningWindow(form);

  if (!window) {
    return true;
  }

  if (window.closed) {
    setMessage("L'aula studio risulta chiusa nel giorno selezionato.", "error");
    return false;
  }

  const startMinutes = getTimeMinutes(form.start_time);
  const endMinutes = getTimeMinutes(form.end_time);

  if (startMinutes === null || endMinutes === null) {
    return true;
  }

  if (startMinutes < window.opens || endMinutes > window.closes) {
    setMessage(`L'aula studio è aperta dalle ${formatMinutes(window.opens)} alle ${formatMinutes(window.closes)}.`, "error");
    return false;
  }

  return true;
}

function hasOverlappingActiveReservation(form) {
  const startTime = new Date(form.start_time);
  const endTime = new Date(form.end_time);

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return false;
  }

  return state.reservations.some((reservation) => {
    if (reservation.status !== "active") {
      return false;
    }

    const reservationStart = new Date(String(reservation.start_time).replace(" ", "T"));
    const reservationEnd = new Date(String(reservation.end_time).replace(" ", "T"));

    if (Number.isNaN(reservationStart.getTime()) || Number.isNaN(reservationEnd.getTime())) {
      return false;
    }

    return reservationStart < endTime && reservationEnd > startTime;
  });
}

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

  async loadRooms({ background = false, availabilitySlot } = {}) {
    if (!background) {
      mutations.setLoadingRooms(true);
    }

    if (availabilitySlot !== undefined) {
      mutations.setRoomsAvailabilitySlot(availabilitySlot);
    }

    try {
      const slot = state.roomsAvailabilitySlot;
      const params = new URLSearchParams();

      if (slot?.start_time && slot?.end_time) {
        params.set("start_time", slot.start_time);
        params.set("end_time", slot.end_time);
      }

      const endpoint = params.toString() ? `/api/rooms?${params.toString()}` : "/api/rooms";
      const rooms = await makeRequest("GET", endpoint);
      mutations.setRooms(rooms);
      mutations.updateStats();
      return rooms;
    } catch (error) {
      throw new Error("Failed to load rooms");
    } finally {
      if (!background) {
        mutations.setLoadingRooms(false);
      }
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

  async cancelReservation(reservationId) {
    try {
      const response = await makeRequest("DELETE", `/api/reservations/${reservationId}`, null, true);
      await Promise.all([
        this.loadReservations(),
        this.loadRooms({ background: true })
      ]);
      return response;
    } catch (error) {
      mutations.setReservationsMessage(error.message || "Cancellazione non riuscita.");
      throw error;
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

    if (new Date(form.start_time) < getCurrentMinute()) {
      mutations.setAvailabilityMessage("Seleziona una data e un orario futuri.", "error");
      return null;
    }

    if (getLocalDatePart(form.start_time) !== getLocalDatePart(form.end_time)) {
      mutations.setAvailabilityMessage("La prenotazione deve iniziare e finire nello stesso giorno.", "error");
      return null;
    }

    if (!validateOpeningWindow(form, mutations.setAvailabilityMessage)) {
      return null;
    }

    if (hasOverlappingActiveReservation(form)) {
      mutations.setAvailabilityMessage("Hai gia una prenotazione attiva in questa fascia oraria.", "error");
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

    if (new Date(form.start_time) < getCurrentMinute()) {
      mutations.setFormMessage("Seleziona una data e un orario futuri.", "error");
      return false;
    }

    if (getLocalDatePart(form.start_time) !== getLocalDatePart(form.end_time)) {
      mutations.setFormMessage("La prenotazione deve iniziare e finire nello stesso giorno.", "error");
      return false;
    }

    if (!validateOpeningWindow(form, mutations.setFormMessage)) {
      return false;
    }

    if (hasOverlappingActiveReservation(form)) {
      mutations.setFormMessage("Hai gia una prenotazione attiva in questa fascia oraria.", "error");
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
