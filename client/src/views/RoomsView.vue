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

        <RoomFilters
          v-model:filters="filters"
          :service-options="serviceOptions"
          :active-count="activeFilterCount"
          :result-count="filteredRooms.length"
          :total-count="rooms.length"
          @reset="resetFilters"
        />

        <CampusMap
          v-if="activeView === 'map' && filteredRooms.length"
          :rooms="filteredRooms"
          :selected-building-code="selectedBuildingCode"
          @select-building="openBuildingReservation"
          @clear-selection="clearBuildingSelection"
        />

        <LocationsList
          v-else-if="filteredRooms.length"
          :rooms="filteredRooms"
          :selected-building-code="selectedBuildingCode"
          @clear-selection="clearBuildingSelection"
          @reserve="openReservationForm"
        />

        <div v-else class="cm-alert cm-alert-muted">
          Nessuna aula corrisponde ai filtri selezionati.
        </div>
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
import RoomFilters from "../components/RoomFilters.vue";
import { apiService } from "../api.js";
import { getters, mutations, state } from "../store.js";

export default {
  name: "RoomsView",
  components: {
    CampusMap,
    HeroStats,
    LocationsList,
    RoomFilters
  },
  data() {
    return {
      activeView: "map",
      selectedBuildingCode: null,
      filters: {
        query: "",
        services: [],
        closing: "",
        onlyAvailable: false
      }
    };
  },
  computed: {
    isAuthenticated() { return getters.isAuthenticated(); },
    rooms() { return state.rooms; },
    loadingRooms() { return state.loadingRooms; },
    totalRooms() { return state.totalRooms; },
    availableSeats() { return state.availableSeats; },
    serviceOptions() {
      const services = new Set();

      for (const room of this.rooms) {
        for (const service of room.services || []) {
          services.add(service);
        }
      }

      return Array.from(services).sort((a, b) => a.localeCompare(b));
    },
    activeFilterCount() {
      return [
        this.filters.query.trim(),
        this.filters.closing,
        this.filters.onlyAvailable,
        ...this.filters.services
      ].filter(Boolean).length;
    },
    filteredRooms() {
      const query = normalizeSearch(this.filters.query);

      return this.rooms.filter((room) => {
        if (this.filters.onlyAvailable && Number(room.available_seats || 0) <= 0) {
          return false;
        }

        if (query && !this.roomMatchesQuery(room, query)) {
          return false;
        }

        if (this.filters.services.length && !this.roomMatchesServices(room)) {
          return false;
        }

        if (this.filters.closing && !this.roomMatchesClosing(room)) {
          return false;
        }

        return true;
      });
    }
  },
  watch: {
    filteredRooms() {
      if (!this.selectedBuildingCode) {
        return;
      }

      const stillVisible = this.filteredRooms.some((room) => room.building_code === this.selectedBuildingCode);

      if (!stillVisible) {
        this.selectedBuildingCode = null;
      }
    }
  },
  methods: {
    openBuildingReservation(buildingCode) {
      const firstRoom = this.filteredRooms.find((room) => room.building_code === buildingCode);

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
    resetFilters() {
      this.filters = {
        query: "",
        services: [],
        closing: "",
        onlyAvailable: false
      };
    },
    roomMatchesQuery(room, query) {
      const searchable = [
        room.name,
        room.room_code,
        room.building,
        room.building_code,
        room.address,
        room.campus_area,
        ...(room.services || [])
      ].map(normalizeSearch).join(" ");

      return searchable.includes(query);
    },
    roomMatchesServices(room) {
      const roomServices = (room.services || []).map(normalizeSearch);

      return this.filters.services.every((selectedService) => {
        const selected = normalizeSearch(selectedService);
        return roomServices.some((service) => service === selected);
      });
    },
    roomMatchesClosing(room) {
      if (this.filters.closing === "weekend") {
        return hasWeekendHours(room.weekend_hours);
      }

      const endMinutes = parseClosingMinutes(room.weekday_hours);

      if (endMinutes === null) {
        return false;
      }

      if (this.filters.closing === "after18") {
        return endMinutes >= 18 * 60;
      }

      if (this.filters.closing === "after20") {
        return endMinutes >= 20 * 60;
      }

      return true;
    }
  }
};

function normalizeSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseClosingMinutes(hours) {
  const matches = String(hours || "").match(/(\d{1,2})[:.](\d{2})/g);

  if (!matches || matches.length === 0) {
    return null;
  }

  const [hour, minute] = matches[matches.length - 1].replace(".", ":").split(":").map(Number);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }

  return hour * 60 + minute;
}

function hasWeekendHours(hours) {
  const normalized = normalizeSearch(hours);
  return Boolean(normalized && !["chiuso", "closed", "-"].includes(normalized));
}
</script>
