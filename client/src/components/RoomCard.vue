<template>
  <div class="card shadow-sm h-100 room-card">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start mb-3 gap-3">
        <div>
          <h5 class="card-title mb-1">{{ room.name }}</h5>
          <p class="text-body-secondary mb-0 small">
            {{ room.building }} - Piano {{ room.floor }}
          </p>
        </div>
        <span :class="['badge', statusColor]">
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

      <button
        class="btn btn-primary btn-sm w-100 mt-3"
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
  emits: ["reserve"]
};
</script>
