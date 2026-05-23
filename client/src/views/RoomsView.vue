<template>
  <template v-if="isAuthenticated">
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
  </template>
</template>

<script>
import CampusMap from "../components/CampusMap.vue";
import HeroStats from "../components/HeroStats.vue";
import LocationsList from "../components/LocationsList.vue";
import { apiService } from "../api.js";
import { getters, mutations, state } from "../store.js";

export default {
  name: "RoomsView",
  components: {
    CampusMap,
    HeroStats,
    LocationsList
  },
  data() {
    return {
      activeView: "map",
      selectedBuildingCode: null
    };
  },
  computed: {
    isAuthenticated() { return getters.isAuthenticated(); },
    rooms() { return state.rooms; },
    loadingRooms() { return state.loadingRooms; },
    totalRooms() { return state.totalRooms; },
    availableSeats() { return state.availableSeats; }
  },
  methods: {
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
    }
  }
};
</script>
