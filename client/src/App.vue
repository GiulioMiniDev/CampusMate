<template>
  <div class="app-shell">
    <nav class="navbar navbar-expand-lg border-bottom bg-white shadow-sm">
      <div class="container-fluid px-3 px-md-4">
        <span class="navbar-brand fw-semibold">CampusMate</span>
        <div v-if="isAuthenticated" class="d-flex align-items-center gap-3">
          <span class="small text-body-secondary d-none d-sm-inline">
            {{ currentUserName }}
          </span>
          <button type="button" class="cm-button cm-button-outline cm-button-sm" @click="logout">
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
          <div v-if="loadingRooms" class="cm-alert cm-alert-info">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            Caricamento aule...
          </div>

          <template v-if="rooms.length && !loadingRooms">
            <div class="view-switcher mb-4" role="group" aria-label="Scegli vista">
              <button
                type="button"
                :class="['view-switcher-button', activeView === 'map' ? 'is-active' : '']"
                @click="activeView = 'map'"
              >
                Mappa
              </button>
              <button
                type="button"
                :class="['view-switcher-button', activeView === 'list' ? 'is-active' : '']"
                @click="activeView = 'list'"
              >
                Lista sedi
              </button>
            </div>

            <CampusMap
              v-if="activeView === 'map'"
              :rooms="rooms"
              :selected-building-code="selectedBuildingCode"
              @select-building="openBuildingReservation"
              @clear-selection="clearBuildingSelection"
            />

            <LocationsList
              v-else
              :rooms="rooms"
              :selected-building-code="selectedBuildingCode"
              @clear-selection="clearBuildingSelection"
              @reserve="openReservationForm"
            />
          </template>

          <div v-else-if="!loadingRooms" class="cm-alert cm-alert-muted">
            Nessuna aula disponibile al momento.
          </div>
        </section>

        <section v-if="socketStatus === 'errore' || socketStatus === 'chiuso'" class="mb-5">
          <div class="cm-alert cm-alert-warning">
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
import AuthPanel from "./components/AuthPanel.vue";
import CampusMap from "./components/CampusMap.vue";
import DiagnosticsPanel from "./components/DiagnosticsPanel.vue";
import HeroStats from "./components/HeroStats.vue";
import LocationsList from "./components/LocationsList.vue";
import ReservationModal from "./components/ReservationModal.vue";
import { apiService } from "./api.js";
import { getters, mutations, state } from "./store.js";
import { websocketService } from "./websocket.js";

export default {
  name: "App",
  components: {
    AuthPanel,
    CampusMap,
    DiagnosticsPanel,
    HeroStats,
    LocationsList,
    ReservationModal
  },
  data() {
    return {
      activeView: "map",
      availabilityTimer: null,
      refreshTimer: null,
      selectedBuildingCode: null
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
    selectedRoomDetail() { return state.selectedRoomDetail; },
    reservationForm() { return state.reservationForm; },
    isSubmitting() { return state.isSubmitting; },
    formMessage() { return state.formMessage; },
    formMessageType() { return state.formMessageType; },
    availabilityCheck() { return state.availabilityCheck; },
    selectedBuildingRooms() {
      const buildingCode = this.selectedBuildingCode || this.selectedRoomDetail?.building_code;

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
    selectBuilding(buildingCode) {
      this.selectedBuildingCode = buildingCode;
    },
    openBuildingReservation(buildingCode) {
      const firstRoom = this.rooms.find((room) => room.building_code === buildingCode);

      if (!firstRoom) {
        return;
      }

      this.selectedBuildingCode = buildingCode;
      this.openReservationForm(firstRoom.id);
    },
    clearBuildingSelection() {
      this.selectedBuildingCode = null;
    },
    openReservationForm(roomId) {
      mutations.showReservationForm(roomId);
      apiService.loadRoomDetail(roomId).catch((error) => console.error("Room detail failed:", error));
    },
    closeReservationForm() {
      mutations.closeReservationForm();
    },
    changeReservationRoom(roomId) {
      this.openReservationForm(roomId);
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
          apiService.loadRooms().catch((error) => console.error("Error reloading rooms:", error));
        }, 1500);
      } catch (error) {
        console.error("Reservation failed:", error);
      }
    }
  }
};
</script>
