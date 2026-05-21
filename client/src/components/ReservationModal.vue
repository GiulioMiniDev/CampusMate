<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="reservation-modal">
      <div class="modal-header">
        <h5 class="modal-title">Prenota aula</h5>
        <button type="button" class="btn-close" aria-label="Chiudi" @click="$emit('close')"></button>
      </div>
      <div class="modal-body">
        <div v-if="formMessage" :class="['alert', formMessageType === 'success' ? 'alert-success' : 'alert-danger']">
          {{ formMessage }}
        </div>

        <form @submit.prevent="$emit('submit')">
          <div class="mb-3">
            <label class="form-label">Inizio prenotazione</label>
            <input v-model="form.start_time" type="datetime-local" class="form-control" required>
          </div>

          <div class="mb-3">
            <label class="form-label">Fine prenotazione</label>
            <input v-model="form.end_time" type="datetime-local" class="form-control" required>
          </div>

          <div class="mb-3">
            <label class="form-label">Tipo prenotazione</label>
            <select v-model="form.reservation_type" class="form-select">
              <option value="individual">Individuale</option>
              <option value="group">Gruppo</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Numero posti</label>
            <input
              v-model.number="form.seats_requested"
              type="number"
              class="form-control"
              min="1"
              required
            >
          </div>

          <div class="mb-3">
            <label class="form-label">Note (opzionale)</label>
            <textarea v-model="form.notes" class="form-control" rows="2"></textarea>
          </div>

          <div class="d-flex gap-2 flex-wrap">
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? "Creazione..." : "Conferma prenotazione" }}
            </button>
            <button type="button" class="btn btn-secondary" :disabled="isSubmitting" @click="$emit('close')">
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ReservationModal",
  props: {
    form: {
      type: Object,
      required: true
    },
    isSubmitting: {
      type: Boolean,
      required: true
    },
    formMessage: {
      type: String,
      default: null
    },
    formMessageType: {
      type: String,
      required: true
    }
  },
  emits: ["close", "submit"]
};
</script>
