<template>
  <template v-if="isAuthenticated">
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
          @select-building="selectBuildingFromMap"
          @clear-selection="clearBuildingSelection"
        />

        <LocationsList
          v-else-if="filteredRooms.length"
          :rooms="filteredRooms"
          :selected-building-code="selectedBuildingCode"
          :can-reserve="isStudent"
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
import LocationsList from "../components/LocationsList.vue";
import RoomFilters from "../components/RoomFilters.vue";
import { apiService } from "../api.js";
import { getters, mutations, state } from "../store.js";

export default {
  name: "RoomsView",
  components: {
    CampusMap,
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
        onlyAvailable: false,
        date: "",
        startClock: "",
        endClock: ""
      },
      roomSlotReloadTimer: null
    };
  },
  computed: {
    isAuthenticated() { return getters.isAuthenticated(); },
    isStudent() { return state.currentUser?.role === "student"; },
    rooms() { return state.rooms; },
    loadingRooms() { return state.loadingRooms; },
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
        this.filters.date || this.filters.startClock || this.filters.endClock,
        ...this.filters.services
      ].filter(Boolean).length;
    },
    availabilitySlot() {
      if (!this.filters.date || !this.filters.startClock || !this.filters.endClock) {
        return null;
      }

      const startTime = `${this.filters.date}T${this.filters.startClock}`;
      const endTime = `${this.filters.date}T${this.filters.endClock}`;

      if (new Date(startTime) >= new Date(endTime)) {
        return null;
      }

      if (new Date(startTime) < getCurrentMinute()) {
        return null;
      }

      return {
        start_time: startTime,
        end_time: endTime
      };
    },
    availabilitySlotKey() {
      return this.availabilitySlot
        ? `${this.availabilitySlot.start_time}|${this.availabilitySlot.end_time}`
        : "";
    },
    filteredRooms() {
      const query = normalizeSearch(this.filters.query);

      return this.rooms.filter((room) => {
        if ((this.filters.onlyAvailable || this.availabilitySlot) && Number(room.available_seats || 0) <= 0) {
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
    },
    availabilitySlotKey() {
      if (this.roomSlotReloadTimer) {
        clearTimeout(this.roomSlotReloadTimer);
      }

      this.roomSlotReloadTimer = setTimeout(() => {
        apiService.loadRooms({
          background: true,
          availabilitySlot: this.availabilitySlot
        }).catch((error) => console.error("Rooms slot reload failed:", error));
      }, 250);
    }
  },
  unmounted() {
    if (this.roomSlotReloadTimer) {
      clearTimeout(this.roomSlotReloadTimer);
    }
  },
  methods: {
    selectBuildingFromMap(buildingCode) {
      this.selectedBuildingCode = buildingCode;
      this.activeView = "list";
    },
    clearBuildingSelection() {
      this.selectedBuildingCode = null;
    },
    openReservationForm(roomId) {
      if (!this.isStudent) {
        mutations.closeReservationForm();
        return;
      }

      mutations.showReservationForm(roomId);
      apiService.loadRoomDetail(roomId).catch((error) => console.error("Room detail failed:", error));
    },
    resetFilters() {
      this.filters = {
        query: "",
        services: [],
        closing: "",
        onlyAvailable: false,
        date: "",
        startClock: "",
        endClock: ""
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

function getCurrentMinute() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}
</script>
