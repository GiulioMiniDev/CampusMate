<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="reservation-modal">
      <div class="modal-header">
        <div>
          <h5 class="modal-title">Prenota sede</h5>
          <p v-if="building" class="modal-subtitle">
            {{ building.code }} - {{ building.name }}
          </p>
        </div>
        <button type="button" class="btn-close" aria-label="Chiudi" @click="$emit('close')"></button>
      </div>
      <div class="modal-body">
        <section v-if="building" class="reservation-building cm-card">
          <div v-if="showBuildingPlaceholder" class="reservation-building-cover room-cover-placeholder">
            <span>{{ building.code }}</span>
          </div>
          <img
            v-else
            class="reservation-building-cover"
            :src="building.imageUrl"
            :alt="`Foto edificio ${building.name}`"
            @error="buildingImageFailed = true"
          >

          <div class="reservation-building-info">
            <h6>{{ building.name }}</h6>
            <p>{{ building.address }}</p>
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
          </div>
        </section>

        <form @submit.prevent="$emit('submit')">
          <div class="mb-3">
            <label class="form-label cm-label">Giorno prenotazione</label>
            <input
              v-model="reservationDate"
              type="date"
              class="form-control cm-field"
              :min="today"
              required
              @change="$emit('check-availability')"
            >
          </div>

          <div class="reservation-time-range mb-3">
            <div>
              <label class="form-label cm-label">Dalle</label>
              <input
                v-model="startClock"
                type="time"
                class="form-control cm-field"
                :min="minStartClock"
                required
                @change="$emit('check-availability')"
              >
            </div>
            <div>
              <label class="form-label cm-label">Alle</label>
              <input
                v-model="endClock"
                type="time"
                class="form-control cm-field"
                :min="minEndClock"
                required
                @change="$emit('check-availability')"
              >
            </div>
          </div>

          <div v-if="buildingRooms.length" class="mb-3">
            <label class="form-label cm-label">Aula</label>
            <select
              :value="form.room_id"
              class="form-select cm-field"
              @change="$emit('change-room', Number($event.target.value))"
            >
              <option v-for="buildingRoom in buildingRooms" :key="buildingRoom.id" :value="buildingRoom.id">
                {{ buildingRoom.name }} - Piano {{ buildingRoom.floor }} - {{ buildingRoom.available_seats }}/{{ buildingRoom.total_seats }} posti
              </option>
            </select>
          </div>

          <div v-if="floorplanTables.length" class="floorplan-scroll mb-3">
            <RoomFloorPlan
              :tables="floorplanTables"
              :selected-table-id="form.study_table_id"
              :has-slot-availability="Boolean(availability.result?.tables)"
              @select-table="$emit('select-table', $event)"
            />
          </div>

          <div v-else class="cm-alert cm-alert-muted">
            Caricamento planimetria aula...
          </div>

          <div class="mb-3">
            <label class="form-label cm-label">Tipo prenotazione</label>
            <select v-model="form.reservation_type" class="form-select cm-field">
              <option value="individual">Individuale</option>
              <option value="group">Gruppo</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label cm-label">Numero posti</label>
            <input
              v-model.number="form.seats_requested"
              type="number"
              class="form-control cm-field"
              min="1"
              required
              @change="$emit('check-availability')"
            >
          </div>

          <div class="mb-3">
            <label class="form-label cm-label">Note (opzionale)</label>
            <textarea v-model="form.notes" class="form-control cm-field" rows="2"></textarea>
          </div>

          <div
            v-if="feedbackMessage"
            :class="['cm-alert', 'reservation-feedback', feedbackClass]"
            role="status"
          >
            {{ feedbackMessage }}
            <span v-if="availability.result?.available">
              Posti compatibili liberi: {{ availability.result.available_seats }}.
            </span>
          </div>

          <div class="d-flex gap-2 flex-wrap">
            <button type="submit" class="cm-button cm-button-primary" :disabled="isSubmitting">
              {{ isSubmitting ? "Creazione..." : "Conferma prenotazione" }}
            </button>
            <button type="button" class="cm-button cm-button-secondary" :disabled="isSubmitting" @click="$emit('close')">
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import RoomFloorPlan from "./RoomFloorPlan.vue";

export default {
  name: "ReservationModal",
  components: {
    RoomFloorPlan
  },
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
    },
    availability: {
      type: Object,
      required: true
    },
    room: {
      type: Object,
      default: null
    },
    buildingRooms: {
      type: Array,
      default: () => []
    }
  },
  emits: ["change-room", "check-availability", "close", "select-table", "submit"],
  data() {
    return {
      buildingImageFailed: false
    };
  },
  watch: {
    "building.code"() {
      this.buildingImageFailed = false;
    }
  },
  computed: {
    feedbackMessage() {
      if (this.formMessage) {
        return this.formMessage;
      }

      if (this.availability.loading) {
        return "Controllo disponibilita in corso...";
      }

      return this.availability.message;
    },
    feedbackClass() {
      if (this.formMessage) {
        return this.formMessageType === "success" ? "cm-alert-success" : "cm-alert-danger";
      }

      if (this.availability.loading) {
        return "cm-alert-info";
      }

      if (this.availability.type === "success") {
        return "cm-alert-success";
      }

      return this.availability.type === "error" ? "cm-alert-danger" : "cm-alert-info";
    },
    today() {
      return this.formatLocalDate(new Date());
    },
    currentClock() {
      return this.formatLocalTime(new Date());
    },
    isTodaySelected() {
      return this.reservationDate === this.today;
    },
    minStartClock() {
      return this.isTodaySelected ? this.currentClock : null;
    },
    minEndClock() {
      if (this.startClock) {
        return this.startClock;
      }

      return this.isTodaySelected ? this.currentClock : null;
    },
    reservationDate: {
      get() {
        return this.getDatePart(this.form.start_time || this.form.end_time);
      },
      set(date) {
        const nextDate = date || "";
        const start = this.normalizeStartClock(nextDate, this.startClock || "09:00");
        const end = this.normalizeEndClock(nextDate, start, this.endClock || "10:00");

        this.form.start_time = nextDate ? `${nextDate}T${start}` : "";
        this.form.end_time = nextDate ? `${nextDate}T${end}` : "";
      }
    },
    startClock: {
      get() {
        return this.getTimePart(this.form.start_time);
      },
      set(time) {
        const date = this.reservationDate || this.today;
        const start = time ? this.normalizeStartClock(date, time) : "";
        this.form.start_time = start ? `${date}T${start}` : "";

        if (start && (!this.form.end_time || this.getDatePart(this.form.end_time) !== date || this.endClock <= start)) {
          this.form.end_time = `${date}T${this.addMinutesToClock(start, 60)}`;
        }
      }
    },
    endClock: {
      get() {
        return this.getTimePart(this.form.end_time);
      },
      set(time) {
        const date = this.reservationDate || this.today;
        const end = time ? this.normalizeEndClock(date, this.startClock, time) : "";
        this.form.end_time = end ? `${date}T${end}` : "";
      }
    },
    building() {
      const sourceRoom = this.room || this.buildingRooms[0];

      if (!sourceRoom) {
        return null;
      }

      return {
        code: sourceRoom.building_code,
        name: sourceRoom.building,
        address: sourceRoom.address,
        campusArea: sourceRoom.campus_area,
        imageUrl: sourceRoom.image_url,
        weekdayHours: sourceRoom.weekday_hours,
        weekendHours: sourceRoom.weekend_hours,
        openingTime: sourceRoom.opening_time,
        closingTime: sourceRoom.closing_time,
        services: sourceRoom.services || []
      };
    },
    showBuildingPlaceholder() {
      return !this.building?.imageUrl || this.buildingImageFailed;
    },
    floorplanTables() {
      return this.availability.result?.tables || this.room?.tables || [];
    }
  },
  methods: {
    getDatePart(value) {
      return value ? String(value).slice(0, 10) : "";
    },
    getTimePart(value) {
      return value ? String(value).slice(11, 16) : "";
    },
    formatLocalDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    },
    formatLocalTime(date) {
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${hours}:${minutes}`;
    },
    normalizeStartClock(date, time) {
      if (date === this.today && time < this.currentClock) {
        return this.currentClock;
      }

      return time;
    },
    normalizeEndClock(date, start, time) {
      const normalizedStart = start || this.normalizeStartClock(date, this.currentClock);

      if (date === this.today && time < this.currentClock) {
        return this.addMinutesToClock(this.currentClock, 60);
      }

      if (normalizedStart && time <= normalizedStart) {
        return this.addMinutesToClock(normalizedStart, 60);
      }

      return time;
    },
    addMinutesToClock(time, minutesToAdd) {
      const [hours, minutes] = String(time || "00:00").split(":").map(Number);
      const totalMinutes = Math.min((hours * 60) + minutes + minutesToAdd, (23 * 60) + 59);
      const nextHours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
      const nextMinutes = String(totalMinutes % 60).padStart(2, "0");

      return `${nextHours}:${nextMinutes}`;
    }
  }
};
</script>
