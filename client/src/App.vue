<template>
  <div class="app-shell">
    <nav class="navbar navbar-expand-lg border-bottom bg-white shadow-sm">
      <div class="container-fluid px-3 px-md-4">
        <span class="navbar-brand fw-semibold">CampusMate</span>
        <div v-if="isAuthenticated" class="d-flex align-items-center gap-3">
          <span class="small text-body-secondary d-none d-sm-inline">
            {{ currentUserName }}
          </span>
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="logout">
            Esci
          </button>
        </div>
      </div>
    </nav>

    <main class="container-fluid px-3 px-md-4 py-4">
      <AuthPanel
        v-if="!isAuthenticated"
        :mode="authMode"
        :login-form="loginForm"
        :register-form="registerForm"
        :is-submitting="authSubmitting"
        :message="authMessage"
        :message-type="authMessageType"
        @switch-mode="switchAuthMode"
        @login="submitLogin"
        @register="submitRegister"
      />

      <template v-else>
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
      </template>
    </main>

    <ReservationModal
      v-if="isAuthenticated && showReservationForm"
      :form="reservationForm"
      :is-submitting="isSubmitting"
      :form-message="formMessage"
      :form-message-type="formMessageType"
      :availability="availabilityCheck"
      @check-availability="scheduleAvailabilityCheck"
      @close="closeReservationForm"
      @submit="submitReservation"
    />
  </div>
</template>

<script>
import AuthPanel from "./components/AuthPanel.vue";
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
    AuthPanel,
    DiagnosticsPanel,
    HeroStats,
    ReservationModal,
    RoomCard
  },
  data() {
    return {
      availabilityTimer: null,
      refreshTimer: null
    };
  },
  computed: {
    authMode() { return state.authMode; },
    authSubmitting() { return state.authSubmitting; },
    authMessage() { return state.authMessage; },
    authMessageType() { return state.authMessageType; },
    loginForm() { return state.loginForm; },
    registerForm() { return state.registerForm; },
    currentUserName() { return getters.getCurrentUserName(); },
    isAuthenticated() { return getters.isAuthenticated(); },
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
    formMessageType() { return state.formMessageType; },
    availabilityCheck() { return state.availabilityCheck; }
  },
  mounted() {
    this.initApp();
  },
  beforeUnmount() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    if (this.availabilityTimer) {
      clearTimeout(this.availabilityTimer);
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

      if (state.authToken) {
        try {
          await apiService.loadCurrentUser();
          await this.startDashboard();
        } catch (error) {
          console.error("Session restore failed:", error);
        }
      }
    },
    async startDashboard() {
      try {
        await apiService.loadRooms();
      } catch (error) {
        console.error("Failed to load rooms:", error);
      }

      websocketService.connect();

      if (!this.refreshTimer) {
        this.refreshTimer = setInterval(() => {
          apiService.loadRooms().catch((error) => console.error("Auto-refresh failed:", error));
        }, 30000);
      }
    },
    switchAuthMode(mode) {
      mutations.setAuthMode(mode);
    },
    async submitLogin() {
      if (!apiService.validateLoginForm()) {
        return;
      }

      try {
        await apiService.login();
        await this.startDashboard();
      } catch (error) {
        console.error("Login failed:", error);
      }
    },
    async submitRegister() {
      if (!apiService.validateRegisterForm()) {
        return;
      }

      try {
        await apiService.register();
        await this.startDashboard();
      } catch (error) {
        console.error("Registration failed:", error);
      }
    },
    logout() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }

      websocketService.disconnect();
      mutations.logout();
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
    scheduleAvailabilityCheck() {
      if (this.availabilityTimer) {
        clearTimeout(this.availabilityTimer);
      }

      this.availabilityTimer = setTimeout(() => {
        apiService.checkRoomAvailability().catch((error) => console.error("Availability check failed:", error));
      }, 250);
    },
    async submitReservation() {
      if (!apiService.validateReservationForm()) {
        return;
      }

      try {
        const availability = await apiService.checkRoomAvailability();

        if (availability && !availability.available) {
          return;
        }
      } catch {
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
