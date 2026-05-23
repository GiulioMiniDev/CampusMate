<template>
  <div class="cm-card h-100 room-card">
    <div v-if="showPlaceholder" class="room-cover room-cover-placeholder">
      <span>{{ room.building_code }}</span>
    </div>

    <img
      v-else
      class="room-cover"
      :src="room.image_url"
      :alt="`Foto edificio ${room.building}`"
      loading="lazy"
      @error="imageFailed = true"
    >

    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-3 gap-3">
        <div>
          <h5 class="card-title mb-1">{{ room.name }}</h5>
          <p class="text-body-secondary mb-0 small">
            {{ room.building_code }} - {{ room.building }} - Piano {{ room.floor }}
          </p>
          <p v-if="room.address" class="room-address mb-0">
            {{ room.address }}
          </p>
        </div>
        <span :class="['cm-badge', statusColor]">
          {{ status }}
        </span>
      </div>

      <div class="progress mb-3">
        <div class="progress-bar" :style="{ width: progressWidth }"></div>
      </div>

      <div class="row g-2 small">
        <div class="col-6">
          <span class="text-body-secondary">Totali:</span>
          <strong>{{ room.total_seats }}</strong>
        </div>
        <div class="col-6">
          <span class="text-body-secondary">Disponibili:</span>
          <strong class="text-success">{{ room.available_seats }}</strong>
        </div>
      </div>

      <div class="room-meta cm-chip-set">
        <span v-if="room.campus_area" class="cm-chip">{{ room.campus_area }}</span>
        <span v-if="room.weekday_hours" class="cm-chip">Feriali {{ room.weekday_hours }}</span>
        <span v-if="room.weekend_hours" class="cm-chip">Weekend {{ room.weekend_hours }}</span>
        <a
          v-if="mapUrl"
          class="cm-chip"
          :href="mapUrl"
          target="_blank"
          rel="noreferrer"
        >
          Mappa
        </a>
      </div>

      <div v-if="room.services?.length" class="room-services cm-chip-set">
        <span v-for="service in room.services" :key="service" class="cm-chip cm-chip-success">
          {{ service }}
        </span>
      </div>

      <button
        class="cm-button cm-button-primary cm-button-sm cm-button-block mt-3"
        type="button"
        :disabled="room.available_seats === 0"
        @click="$emit('reserve', room.id)"
      >
        {{ room.available_seats > 0 ? "Prenota" : "Non disponibile" }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "RoomCard",
  props: {
    room: {
      type: Object,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    statusColor: {
      type: String,
      required: true
    },
    progressWidth: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      imageFailed: false
    };
  },
  emits: ["reserve"],
  computed: {
    showPlaceholder() {
      return !this.room.image_url || this.imageFailed;
    },
    mapUrl() {
      if (!this.room.latitude || !this.room.longitude) {
        return null;
      }

      return `https://www.google.com/maps?q=${this.room.latitude},${this.room.longitude}`;
    }
  }
};
</script>
