// Main App - Orchestrazione Vue.js
import { state, getters, mutations } from './store.js';
import { apiService } from './api.js';
import { websocketService } from './websocket.js';

const { createApp } = Vue;

createApp({
  data() {
    return {
      state,
      getters
    };
  },
  
  computed: {
    // Esponi il state come computed properties
    apiBaseUrl() { return state.apiBaseUrl; },
    backendStatus() { return state.backendStatus; },
    socketStatus() { return state.socketStatus; },
    health() { return state.health; },
    socketMessages() { return state.socketMessages; },
    rooms() { return state.rooms; },
    loadingRooms() { return state.loadingRooms; },
    totalRooms() { return state.totalRooms; },
    availableSeats() { return state.availableSeats; },
    showReservationForm() { return state.showReservationForm; },
    selectedRoomId() { return state.selectedRoomId; },
    reservationForm() { return state.reservationForm; },
    isSubmitting() { return state.isSubmitting; },
    formMessage() { return state.formMessage; },
    formMessageType() { return state.formMessageType; }
  },
  
  mounted() {
    // Inizializza l'app
    this.initApp();
  },
  
  methods: {
    // Lifecycle
    async initApp() {
      try {
        await apiService.loadHealth();
      } catch (error) {
        console.error("Health check failed:", error);
      }
      
      try {
        await apiService.loadRooms();
      } catch (error) {
        console.error("Failed to load rooms:", error);
      }
      
      // Connetti WebSocket
      websocketService.connect();
      
      // Ricarica aule ogni 30 secondi
      setInterval(() => {
        apiService.loadRooms().catch(err => console.error("Auto-refresh failed:", err));
      }, 30000);
    },
    
    // Room helpers
    getRoomStatus(room) {
      return getters.getRoomStatus(room);
    },
    
    getRoomStatusColor(room) {
      return getters.getRoomStatusColor(room);
    },
    
    getRoomProgressWidth(room) {
      return getters.getRoomProgressWidth(room);
    },
    
    // Form methods
    openReservationForm(roomId) {
      mutations.showReservationForm(roomId);
    },
    
    closeReservationForm() {
      mutations.closeReservationForm();
    },
    
    updateFormField(field, value) {
      mutations.updateReservationFormField(field, value);
    },
    
    async submitReservation() {
      if (!apiService.validateReservationForm()) {
        return;
      }

      try {
        await apiService.createReservation(state.reservationForm);
        
        // Chiudi form e ricarica dopo 1.5 secondi
        setTimeout(() => {
          mutations.closeReservationForm();
          apiService.loadRooms().catch(err => console.error("Error reloading rooms:", err));
        }, 1500);
      } catch (error) {
        console.error("Reservation failed:", error);
      }
    }
  }
}).mount("#app");
