import { reactive } from "vue";

const AUTH_STORAGE_KEY = "campusmate.auth";
const storedAuth = readStoredAuth();

export const state = reactive({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8000",
  authToken: storedAuth?.token || "",
  currentUser: storedAuth?.user || null,
  authMode: "login",
  authSubmitting: false,
  authMessage: null,
  authMessageType: "success",
  loginForm: {
    email: "",
    password: ""
  },
  registerForm: {
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirm: "",
    student_number: "",
    degree_course: "",
    year_of_study: "",
    phone: ""
  },
  backendStatus: "offline",
  socketStatus: "disconnesso",
  health: null,
  socketMessages: [],
  rooms: [],
  loadingRooms: false,
  totalRooms: 0,
  availableSeats: 0,
  showReservationForm: false,
  selectedRoomId: null,
  isSubmitting: false,
  availabilityCheck: {
    loading: false,
    result: null,
    message: null,
    type: "info"
  },
  formMessage: null,
  formMessageType: "success",
  reservationForm: {
    room_id: null,
    start_time: "",
    end_time: "",
    reservation_type: "individual",
    seats_requested: 1,
    notes: ""
  }
});

export const getters = {
  isAuthenticated() {
    return Boolean(state.authToken && state.currentUser);
  },

  getCurrentUserName() {
    if (!state.currentUser) return "";

    return `${state.currentUser.first_name} ${state.currentUser.last_name}`;
  },

  getRoomStatus(room) {
    if (room.available_seats === 0) return "Piena";
    if (room.available_seats < room.total_seats * 0.3) return "Quasi piena";
    return "Disponibile";
  },

  getRoomStatusColor(room) {
    if (room.available_seats === 0) return "bg-danger";
    if (room.available_seats < room.total_seats * 0.3) return "bg-warning";
    return "bg-success";
  },

  getRoomProgressWidth(room) {
    return `${((room.total_seats - room.available_seats) / room.total_seats) * 100}%`;
  }
};

export const mutations = {
  setAuthMode(mode) {
    state.authMode = mode;
    state.authMessage = null;
  },

  setAuthSubmitting(submitting) {
    state.authSubmitting = submitting;
  },

  setAuthMessage(message, type = "success") {
    state.authMessage = message;
    state.authMessageType = type;
  },

  setAuthSession(session) {
    state.authToken = session.token;
    state.currentUser = session.user;
    state.authMessage = null;
    state.loginForm.password = "";
    state.registerForm.password = "";
    state.registerForm.password_confirm = "";
    persistAuth(session);
  },

  setCurrentUser(user) {
    state.currentUser = user;
    persistAuth({
      token: state.authToken,
      user
    });
  },

  logout() {
    state.authToken = "";
    state.currentUser = null;
    state.rooms = [];
    state.totalRooms = 0;
    state.availableSeats = 0;
    state.showReservationForm = false;
    state.selectedRoomId = null;
    state.socketMessages = [];
    state.socketStatus = "disconnesso";
    state.formMessage = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  setBackendStatus(status) {
    state.backendStatus = status;
  },

  setHealth(health) {
    state.health = health;
  },

  setRooms(rooms) {
    state.rooms = rooms;
  },

  setLoadingRooms(loading) {
    state.loadingRooms = loading;
  },

  updateStats() {
    state.totalRooms = state.rooms.length;
    state.availableSeats = state.rooms.reduce((sum, room) => sum + (room.available_seats || 0), 0);
  },

  setSocketStatus(status) {
    state.socketStatus = status;
  },

  addSocketMessage(message) {
    state.socketMessages.unshift(message);
    state.socketMessages = state.socketMessages.slice(0, 5);
  },

  showReservationForm(roomId) {
    state.selectedRoomId = roomId;
    state.reservationForm.room_id = roomId;
    state.showReservationForm = true;
    state.formMessage = null;
    this.resetAvailabilityCheck();
  },

  closeReservationForm() {
    state.showReservationForm = false;
    this.resetForm();
    this.resetAvailabilityCheck();
  },

  resetForm() {
    state.reservationForm = {
      room_id: state.selectedRoomId,
      start_time: "",
      end_time: "",
      reservation_type: "individual",
      seats_requested: 1,
      notes: ""
    };
    state.formMessage = null;
    this.resetAvailabilityCheck();
  },

  setFormMessage(message, type = "success") {
    state.formMessage = message;
    state.formMessageType = type;
  },

  setIsSubmitting(submitting) {
    state.isSubmitting = submitting;
  },

  setAvailabilityLoading(loading) {
    state.availabilityCheck.loading = loading;
  },

  setAvailabilityResult(result) {
    state.availabilityCheck.result = result;
    state.availabilityCheck.message = result.message;
    state.availabilityCheck.type = result.available ? "success" : "error";
  },

  setAvailabilityMessage(message, type = "info") {
    state.availabilityCheck.result = null;
    state.availabilityCheck.message = message;
    state.availabilityCheck.type = type;
  },

  resetAvailabilityCheck() {
    state.availabilityCheck = {
      loading: false,
      result: null,
      message: null,
      type: "info"
    };
  }
};

function readStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function persistAuth(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}
