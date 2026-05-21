import { reactive } from "vue";

export const state = reactive({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8000",
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
  formMessage: null,
  formMessageType: "success",
  reservationForm: {
    user_id: 1,
    room_id: null,
    start_time: "",
    end_time: "",
    reservation_type: "individual",
    seats_requested: 1,
    notes: ""
  }
});

export const getters = {
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
  },

  closeReservationForm() {
    state.showReservationForm = false;
    this.resetForm();
  },

  resetForm() {
    state.reservationForm = {
      user_id: 1,
      room_id: state.selectedRoomId,
      start_time: "",
      end_time: "",
      reservation_type: "individual",
      seats_requested: 1,
      notes: ""
    };
    state.formMessage = null;
  },

  setFormMessage(message, type = "success") {
    state.formMessage = message;
    state.formMessageType = type;
  },

  setIsSubmitting(submitting) {
    state.isSubmitting = submitting;
  }
};
