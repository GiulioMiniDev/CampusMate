<template>
  <div :class="['app-shell', isAuthenticated ? 'has-mobile-tabs' : '']">
    <nav class="navbar navbar-expand-lg border-bottom bg-white shadow-sm">
      <div class="container-fluid px-3 px-md-4">
        <span class="navbar-brand fw-semibold">CampusMate</span>
        <div v-if="isAuthenticated" class="app-nav">
          <RouterLink class="app-nav-link" to="/aule">
            <MapPinned class="app-nav-icon" aria-hidden="true" />
            <span>Aule</span>
          </RouterLink>
          <RouterLink class="app-nav-link" to="/prenotazioni">
            <TicketCheck class="app-nav-icon" aria-hidden="true" />
            <span>Prenotazioni</span>
          </RouterLink>
          <RouterLink class="app-nav-link" to="/account">
            <UserRound class="app-nav-icon" aria-hidden="true" />
            <span>Account</span>
          </RouterLink>
          <RouterLink v-if="currentUser?.role === 'admin'" class="app-nav-link" to="/admin">
            <UserRound class="app-nav-icon" aria-hidden="true" />
            <span>Admin</span>
          </RouterLink>
        </div>
        <div v-if="isAuthenticated" class="app-userbar d-none d-md-flex">
          <span class="small text-body-secondary">{{ currentUserName }}</span>
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
        <RouterView @logout="logout" />

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
      :room="selectedRoomDetail"
      :building-rooms="selectedBuildingRooms"
      @check-availability="scheduleAvailabilityCheck"
      @change-room="changeReservationRoom"
      @close="closeReservationForm"
      @select-table="selectStudyTable"
      @submit="submitReservation"
    />
  </div>
</template>

<script>
import { MapPinned, TicketCheck, UserRound } from "@lucide/vue";
import AuthPanel from "./components/AuthPanel.vue";
import DiagnosticsPanel from "./components/DiagnosticsPanel.vue";
import ReservationModal from "./components/ReservationModal.vue";
import { apiService } from "./api.js";
import { getters, mutations, state } from "./store.js";
import { websocketService } from "./websocket.js";

export default {
  name: "App",
  components: {
    AuthPanel,
    DiagnosticsPanel,
    MapPinned,
    ReservationModal,
    TicketCheck,
    UserRound
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
    currentUser() { return state.currentUser; },
    isAuthenticated() { return getters.isAuthenticated(); },
    health() { return state.health; },
    socketMessages() { return state.socketMessages; },
    socketStatus() { return state.socketStatus; },
    rooms() { return state.rooms; },
    showReservationForm() { return state.showReservationForm; },
    selectedRoomDetail() { return state.selectedRoomDetail; },
    reservationForm() { return state.reservationForm; },
    isSubmitting() { return state.isSubmitting; },
    formMessage() { return state.formMessage; },
    formMessageType() { return state.formMessageType; },
    availabilityCheck() { return state.availabilityCheck; },
    selectedBuildingRooms() {
      const buildingCode = this.selectedRoomDetail?.building_code
        || this.rooms.find((room) => room.id === this.reservationForm.room_id)?.building_code;

      if (!buildingCode) {
        return [];
      }

      return this.rooms.filter((room) => room.building_code === buildingCode);
    }
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
  watch: {
    socketStatus() {
      this.syncFallbackRefresh();
    }
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
      this.syncFallbackRefresh();
    },
    syncFallbackRefresh() {
      const needsFallback = this.isAuthenticated && ["errore", "chiuso"].includes(this.socketStatus);

      if (!needsFallback && this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
        return;
      }

      if (needsFallback && !this.refreshTimer) {
        this.refreshTimer = setInterval(() => {
          apiService.loadRooms({ background: true }).catch((error) => console.error("Auto-refresh failed:", error));
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
        this.$router.push("/aule");
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
        this.$router.push("/aule");
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
      this.$router.push("/aule");
    },
    closeReservationForm() {
      mutations.closeReservationForm();
    },
    changeReservationRoom(roomId) {
      this.openReservationForm(roomId);
    },
    openReservationForm(roomId) {
      mutations.showReservationForm(roomId);
      apiService.loadRoomDetail(roomId).catch((error) => console.error("Room detail failed:", error));
    },
    scheduleAvailabilityCheck() {
      if (this.availabilityTimer) {
        clearTimeout(this.availabilityTimer);
      }

      this.availabilityTimer = setTimeout(() => {
        apiService.checkRoomAvailability().catch((error) => console.error("Availability check failed:", error));
      }, 250);
    },
    selectStudyTable(tableId) {
      mutations.selectStudyTable(tableId);
      this.scheduleAvailabilityCheck();
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
          apiService.loadRooms({ background: true }).catch((error) => console.error("Error reloading rooms:", error));
        }, 1500);
      } catch (error) {
        console.error("Reservation failed:", error);
      }
    }
  }
};
</script>
