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
        <section v-if="building" class="reservation-building">
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
            <div class="room-meta">
              <span v-if="building.campusArea">{{ building.campusArea }}</span>
              <span v-if="building.weekdayHours">Feriali {{ building.weekdayHours }}</span>
              <span v-if="building.weekendHours">Weekend {{ building.weekendHours }}</span>
            </div>
            <div v-if="building.services.length" class="room-services">
              <span v-for="service in building.services" :key="service">
                {{ service }}
              </span>
            </div>
          </div>
        </section>

        <div v-if="formMessage" :class="['alert', formMessageType === 'success' ? 'alert-success' : 'alert-danger']">
          {{ formMessage }}
        </div>

        <div v-if="availability.loading" class="alert alert-info">
          Controllo disponibilita in corso...
        </div>

        <div v-else-if="availability.message" :class="['alert', availability.type === 'success' ? 'alert-success' : availability.type === 'error' ? 'alert-danger' : 'alert-info']">
          {{ availability.message }}
          <span v-if="availability.result?.available">
            Posti compatibili liberi: {{ availability.result.available_seats }}.
          </span>
        </div>

        <RoomFloorPlan
          v-if="floorplanTables.length"
          class="mb-3"
          :tables="floorplanTables"
          :selected-table-id="form.study_table_id"
          :has-slot-availability="Boolean(availability.result?.tables)"
          @select-table="$emit('select-table', $event)"
        />

        <div v-else class="alert alert-secondary">
          Caricamento planimetria aula...
        </div>

        <form @submit.prevent="$emit('submit')">
          <div v-if="buildingRooms.length" class="mb-3">
            <label class="form-label">Aula</label>
            <select
              :value="form.room_id"
              class="form-select"
              @change="$emit('change-room', Number($event.target.value))"
            >
              <option v-for="buildingRoom in buildingRooms" :key="buildingRoom.id" :value="buildingRoom.id">
                {{ buildingRoom.name }} - Piano {{ buildingRoom.floor }} - {{ buildingRoom.available_seats }}/{{ buildingRoom.total_seats }} posti
              </option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Inizio prenotazione</label>
            <input
              v-model="form.start_time"
              type="datetime-local"
              class="form-control"
              required
              @change="$emit('check-availability')"
            >
          </div>

          <div class="mb-3">
            <label class="form-label">Fine prenotazione</label>
            <input
              v-model="form.end_time"
              type="datetime-local"
              class="form-control"
              required
              @change="$emit('check-availability')"
            >
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
              @change="$emit('check-availability')"
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
        services: sourceRoom.services || []
      };
    },
    showBuildingPlaceholder() {
      return !this.building?.imageUrl || this.buildingImageFailed;
    },
    floorplanTables() {
      return this.availability.result?.tables || this.room?.tables || [];
    }
  }
};
</script>
