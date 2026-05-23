<template>
  <section>
    <div class="cm-section-header">
      <div>
        <h2 class="h3 mb-0">{{ title }}</h2>
        <small class="cm-section-kicker">{{ visibleBuildings.length }} sedi, {{ visibleRooms.length }} aule</small>
      </div>
      <button
        v-if="selectedBuildingCode"
        type="button"
        class="cm-button cm-button-outline cm-button-sm"
        @click="$emit('clear-selection')"
      >
        Tutte le sedi
      </button>
    </div>

    <div class="locations-list">
      <article v-for="building in visibleBuildings" :key="building.code" class="location-group">
        <div v-if="showPlaceholder(building)" class="location-cover room-cover-placeholder">
          <span>{{ building.code }}</span>
        </div>
        <img
          v-else
          class="location-cover"
          :src="building.imageUrl"
          :alt="`Foto edificio ${building.name}`"
          loading="lazy"
          @error="markImageFailed(building.code)"
        >

        <div class="location-content">
          <div class="location-heading">
            <div>
              <h3>{{ building.name }}</h3>
              <p>{{ building.code }} - {{ building.address }}</p>
            </div>
            <strong class="cm-chip cm-chip-success">{{ building.availableSeats }}/{{ building.totalSeats }}</strong>
          </div>

          <div class="room-meta cm-chip-set">
            <span v-if="building.campusArea" class="cm-chip">{{ building.campusArea }}</span>
            <span v-if="building.weekdayHours" class="cm-chip">Feriali {{ building.weekdayHours }}</span>
            <span v-if="building.weekendHours" class="cm-chip">Weekend {{ building.weekendHours }}</span>
          </div>

          <div v-if="building.services.length" class="room-services cm-chip-set">
            <span v-for="service in building.services" :key="service" class="cm-chip cm-chip-success">
              {{ service }}
            </span>
          </div>

          <div class="location-rooms">
            <div v-for="room in building.rooms" :key="room.id" class="location-room-row">
              <div>
                <strong>{{ room.name }}</strong>
                <span>Piano {{ room.floor }} - {{ getRoomStatus(room) }}</span>
              </div>
              <div class="location-room-actions">
                <small>{{ room.available_seats }}/{{ room.total_seats }} posti</small>
                <button
                  type="button"
                  class="cm-button cm-button-primary cm-button-sm"
                  :disabled="room.available_seats === 0"
                  @click="$emit('reserve', room.id)"
                >
                  Prenota
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script>
import { getters } from "../store.js";

export default {
  name: "LocationsList",
  props: {
    rooms: {
      type: Array,
      required: true
    },
    selectedBuildingCode: {
      type: String,
      default: null
    }
  },
  emits: ["clear-selection", "reserve"],
  data() {
    return {
      failedImages: {}
    };
  },
  computed: {
    visibleRooms() {
      if (!this.selectedBuildingCode) {
        return this.rooms;
      }

      return this.rooms.filter((room) => room.building_code === this.selectedBuildingCode);
    },
    visibleBuildings() {
      const byCode = new Map();

      for (const room of this.visibleRooms) {
        const existing = byCode.get(room.building_code) || {
          code: room.building_code,
          name: room.building,
          address: room.address,
          campusArea: room.campus_area,
          imageUrl: room.image_url,
          weekdayHours: room.weekday_hours,
          weekendHours: room.weekend_hours,
          services: room.services || [],
          rooms: [],
          totalSeats: 0,
          availableSeats: 0
        };

        existing.rooms.push(room);
        existing.totalSeats += Number(room.total_seats || 0);
        existing.availableSeats += Number(room.available_seats || 0);
        byCode.set(room.building_code, existing);
      }

      return Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code));
    },
    title() {
      if (!this.selectedBuildingCode) {
        return "Lista sedi";
      }

      const selectedBuilding = this.visibleBuildings[0];
      return selectedBuilding ? selectedBuilding.name : "Lista sedi";
    }
  },
  methods: {
    showPlaceholder(building) {
      return !building.imageUrl || this.failedImages[building.code];
    },
    markImageFailed(buildingCode) {
      this.failedImages = {
        ...this.failedImages,
        [buildingCode]: true
      };
    },
    getRoomStatus(room) {
      return getters.getRoomStatus(room);
    },
    getRoomStatusColor(room) {
      return getters.getRoomStatusColor(room);
    }
  }
};
</script>
