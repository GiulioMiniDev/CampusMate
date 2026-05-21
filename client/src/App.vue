<template>
  <div class="app-shell">
    <nav class="navbar navbar-expand-lg border-bottom bg-white shadow-sm">
      <div class="container-fluid px-3 px-md-4">
        <span class="navbar-brand fw-semibold">CampusMate</span>
      </div>
    </nav>

    <main class="container-fluid px-3 px-md-4 py-4">
      <HeroStats :total-rooms="totalRooms" :available-seats="availableSeats" />

      <section class="mb-5">
        <div class="d-flex align-items-center justify-content-between mb-4">
          <h2 class="h3 mb-0">Aule studio disponibili</h2>
          <small class="text-body-secondary">Visualizza e prenota</small>
        </div>

        <div v-if="loadingRooms" class="alert alert-info">
          <div class="spinner-border spinner-border-sm me-2" role="status"></div>
          Caricamento aule...
        </div>

        <div v-if="rooms.length && !loadingRooms" class="row g-3">
          <div v-for="room in rooms" :key="room.id" class="col-lg-6">
            <RoomCard
              :room="room"
              :status="getRoomStatus(room)"
              :status-color="getRoomStatusColor(room)"
              :progress-width="getRoomProgressWidth(room)"
              @reserve="openReservationForm"
            />
          </div>
        </div>

        <div v-else-if="!loadingRooms" class="alert alert-secondary">
          Nessuna aula disponibile al momento.
        </div>
      </section>

      <section v-if="socketStatus === 'errore' || socketStatus === 'chiuso'" class="mb-5">
        <div class="alert alert-warning">
          Aggiornamenti realtime non disponibili. La dashboard continua ad aggiornarsi periodicamente.
        </div>
      </section>

      <DiagnosticsPanel :health="health" :socket-messages="socketMessages" />
    </main>

    <ReservationModal
      v-if="showReservationForm"
      :form="reservationForm"
      :is-submitting="isSubmitting"
      :form-message="formMessage"
      :form-message-type="formMessageType"
      @close="closeReservationForm"
      @submit="submitReservation"
    />
  </div>
</template>

<script>
import DiagnosticsPanel from "./components/DiagnosticsPanel.vue";
import HeroStats from "./components/HeroStats.vue";
import ReservationModal from "./components/ReservationModal.vue";
import RoomCard from "./components/RoomCard.vue";
import { apiService } from "./api.js";
import { getters, mutations, state } from "./store.js";
import { websocketService } from "./websocket.js";

export default {
  name: "App",
  components: {
    DiagnosticsPanel,
    HeroStats,
    ReservationModal,
    RoomCard
  },
  data() {
    return {
      refreshTimer: null
    };
  },
  computed: {
    health() { return state.health; },
    socketMessages() { return state.socketMessages; },
    socketStatus() { return state.socketStatus; },
    rooms() { return state.rooms; },
    loadingRooms() { return state.loadingRooms; },
    totalRooms() { return state.totalRooms; },
    availableSeats() { return state.availableSeats; },
    showReservationForm() { return state.showReservationForm; },
    reservationForm() { return state.reservationForm; },
    isSubmitting() { return state.isSubmitting; },
    formMessage() { return state.formMessage; },
    formMessageType() { return state.formMessageType; }
  },
  mounted() {
    this.initApp();
  },
  beforeUnmount() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    websocketService.disconnect();
  },
  methods: {
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

      websocketService.connect();

      this.refreshTimer = setInterval(() => {
        apiService.loadRooms().catch((error) => console.error("Auto-refresh failed:", error));
      }, 30000);
    },
    getRoomStatus(room) {
      return getters.getRoomStatus(room);
    },
    getRoomStatusColor(room) {
      return getters.getRoomStatusColor(room);
    },
    getRoomProgressWidth(room) {
      return getters.getRoomProgressWidth(room);
    },
    openReservationForm(roomId) {
      mutations.showReservationForm(roomId);
    },
    closeReservationForm() {
      mutations.closeReservationForm();
    },
    async submitReservation() {
      if (!apiService.validateReservationForm()) {
        return;
      }

      try {
        await apiService.createReservation(state.reservationForm);

        setTimeout(() => {
          mutations.closeReservationForm();
          apiService.loadRooms().catch((error) => console.error("Error reloading rooms:", error));
        }, 1500);
      } catch (error) {
        console.error("Reservation failed:", error);
      }
    }
  }
};
</script>
