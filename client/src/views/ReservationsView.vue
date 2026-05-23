<template>
  <section>
    <div class="cm-section-header reservations-header">
      <div>
        <p class="text-uppercase small fw-semibold tracking mb-2">Accesso reception</p>
        <h1 class="h3 mb-1">Le mie prenotazioni</h1>
        <small class="cm-section-kicker">
          {{ activeReservations.length }} prenotazioni attive
        </small>
      </div>
      <button type="button" class="cm-button cm-button-outline cm-button-sm" @click="refreshReservations">
        Aggiorna
      </button>
    </div>

    <div v-if="loadingReservations" class="cm-alert cm-alert-info">
      <div class="spinner-border spinner-border-sm me-2" role="status"></div>
      Caricamento prenotazioni...
    </div>

    <div v-else-if="reservationsMessage" class="cm-alert cm-alert-danger">
      {{ reservationsMessage }}
    </div>

    <div v-else-if="!activeReservations.length" class="cm-panel reservations-empty">
      <h2 class="h5 mb-2">Nessuna prenotazione attiva</h2>
      <p class="text-body-secondary mb-0">
        Quando prenoti un tavolo, qui comparira il QR code da mostrare alla reception.
      </p>
    </div>

    <div v-else class="reservations-list">
      <article
        v-for="reservation in activeReservations"
        :key="reservation.id"
        class="reservation-card cm-card"
      >
        <div class="reservation-card-main">
          <div class="reservation-card-title">
            <div>
              <span class="cm-badge cm-badge-success">Attiva</span>
              <h2>{{ reservation.room_name }}</h2>
              <p>{{ reservation.building_name }} - Tavolo {{ reservation.table_code }}</p>
            </div>
            <span class="reservation-id">#{{ reservation.id }}</span>
          </div>

          <dl class="reservation-details">
            <div>
              <dt>Inizio</dt>
              <dd>{{ formatDateTime(reservation.start_time) }}</dd>
            </div>
            <div>
              <dt>Fine</dt>
              <dd>{{ formatDateTime(reservation.end_time) }}</dd>
            </div>
            <div>
              <dt>Posti</dt>
              <dd>{{ reservation.seats_requested }}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{{ formatReservationType(reservation.reservation_type) }}</dd>
            </div>
          </dl>

          <p v-if="reservation.notes" class="reservation-notes">
            {{ reservation.notes }}
          </p>
        </div>

        <div class="reservation-qr-panel">
          <div class="reservation-qr">
            <img
              v-if="qrCodes[reservation.id]"
              :src="qrCodes[reservation.id]"
              :alt="`QR prenotazione ${reservation.id}`"
            >
            <div v-else class="reservation-qr-loading">QR</div>
          </div>
          <small>Mostralo alla reception</small>
        </div>
      </article>
    </div>
  </section>
</template>

<script>
import QRCode from "qrcode";
import { apiService } from "../api.js";
import { getters, state } from "../store.js";

export default {
  name: "ReservationsView",
  data() {
    return {
      qrCodes: {}
    };
  },
  computed: {
    activeReservations() { return getters.getActiveReservations(); },
    loadingReservations() { return state.loadingReservations; },
    reservationsMessage() { return state.reservationsMessage; }
  },
  watch: {
    activeReservations: {
      handler() {
        this.generateQrCodes();
      },
      deep: true
    }
  },
  mounted() {
    this.refreshReservations();
  },
  methods: {
    refreshReservations() {
      apiService.loadReservations().catch((error) => console.error("Reservations load failed:", error));
    },
    async generateQrCodes() {
      const nextQrCodes = { ...this.qrCodes };

      for (const reservation of this.activeReservations) {
        if (nextQrCodes[reservation.id]) {
          continue;
        }

        const payload = {
          type: "campusmate.reservation",
          reservation_id: reservation.id,
          user_id: reservation.user_id,
          room_id: reservation.room_id,
          study_table_id: reservation.study_table_id,
          start_time: reservation.start_time,
          end_time: reservation.end_time,
          status: reservation.status
        };

        nextQrCodes[reservation.id] = await QRCode.toDataURL(JSON.stringify(payload), {
          margin: 1,
          width: 180,
          color: {
            dark: "#1f2937",
            light: "#ffffff"
          }
        });
      }

      this.qrCodes = nextQrCodes;
    },
    formatDateTime(value) {
      return new Intl.DateTimeFormat("it-IT", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(value));
    },
    formatReservationType(value) {
      return value === "group" ? "Gruppo" : "Individuale";
    }
  }
};
</script>
