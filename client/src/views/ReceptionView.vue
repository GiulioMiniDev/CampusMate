<template>
  <section>
    <div class="cm-section-header reception-header">
      <div>
        <p class="text-uppercase small fw-semibold tracking mb-2">Accesso reception</p>
        <h1 class="h3 mb-1">Scanner ingressi</h1>
        <small class="cm-section-kicker">{{ scopeLabel }}</small>
      </div>
      <button type="button" class="cm-button cm-button-outline cm-button-sm" @click="refreshOverview">
        Aggiorna
      </button>
    </div>

    <div v-if="message" :class="['cm-alert', messageType === 'success' ? 'cm-alert-success' : 'cm-alert-danger']">
      {{ message }}
    </div>

    <div class="reception-grid">
      <div class="cm-panel scanner-panel p-3 p-md-4">
        <div class="scanner-frame">
          <video ref="video" class="scanner-video" autoplay muted playsinline></video>
          <div v-if="!cameraActive" class="scanner-placeholder">
            Scanner QR
          </div>
        </div>

        <div class="scanner-actions">
          <button
            type="button"
            class="cm-button cm-button-primary"
            :disabled="cameraActive || scannerLoading"
            @click="startScanner"
          >
            {{ scannerLoading ? "Avvio..." : "Avvia camera" }}
          </button>
          <button
            type="button"
            class="cm-button cm-button-outline"
            :disabled="!cameraActive"
            @click="stopScanner"
          >
            Stop
          </button>
        </div>

        <p class="scanner-note mb-0">
          Inquadra il QR della prenotazione per registrare l'ingresso.
        </p>
      </div>

      <div class="cm-panel p-3 p-md-4">
        <div class="reception-stat-row">
          <div>
            <span class="reception-stat-value">{{ present.length }}</span>
            <span class="reception-stat-label">presenti</span>
          </div>
          <div>
            <span class="reception-stat-value">{{ expected.length }}</span>
            <span class="reception-stat-label">attesi ora</span>
          </div>
        </div>

        <h2 class="h5 mb-3">Attesi adesso</h2>
        <div v-if="!expected.length" class="cm-alert cm-alert-muted">Nessun ingresso atteso in questo momento.</div>
        <div v-else class="reception-list compact">
          <article v-for="reservation in expected" :key="reservation.id" class="reception-row">
            <div>
              <strong>{{ reservation.user_name }}</strong>
              <span>{{ reservation.room_name }} - Tavolo {{ reservation.table_code }}</span>
            </div>
            <small>{{ formatTime(reservation.start_time) }} - {{ formatTime(reservation.end_time) }}</small>
          </article>
        </div>
      </div>
    </div>

    <div class="cm-panel mt-4 p-3 p-md-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="h5 mb-0">Presenti in aula</h2>
        <span class="cm-badge cm-badge-success">{{ present.length }}</span>
      </div>

      <div v-if="loading" class="cm-alert cm-alert-info">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        Caricamento presenze...
      </div>

      <div v-else-if="!present.length" class="cm-alert cm-alert-muted">
        Nessuno studente risulta presente negli edifici assegnati.
      </div>

      <div v-else class="reception-list">
        <article v-for="reservation in present" :key="reservation.id" class="reception-card">
          <div>
            <span class="cm-badge cm-badge-success">Presente</span>
            <h3>{{ reservation.user_name }}</h3>
            <p>{{ reservation.building_code }} - {{ reservation.room_name }} - Tavolo {{ reservation.table_code }}</p>
            <small>
              Check-in {{ formatDateTime(reservation.checked_in_at) }} &middot; fine {{ formatTime(reservation.end_time) }}
            </small>
          </div>
          <span class="reservation-presence-time">{{ formatTime(reservation.checked_in_at) }}</span>
        </article>
      </div>
    </div>
  </section>
</template>

<script>
import { apiService } from "../api.js";
import { parseDateTime } from "../store.js";

export default {
  name: "ReceptionView",
  data() {
    return {
      buildings: [],
      present: [],
      expected: [],
      loading: false,
      scannerLoading: false,
      cameraActive: false,
      checkInLoading: false,
      message: "",
      messageType: "success",
      qrReader: null,
      scannerControls: null,
      lastScannedValue: ""
    };
  },
  computed: {
    scopeLabel() {
      if (!this.buildings.length) {
        return "Nessun edificio assegnato";
      }

      return this.buildings.map((building) => building.code).join(", ");
    }
  },
  mounted() {
    this.refreshOverview();
    window.addEventListener("campusmate:reception-updated", this.refreshOverview);
  },
  beforeUnmount() {
    window.removeEventListener("campusmate:reception-updated", this.refreshOverview);
    this.stopScanner();
  },
  methods: {
    async refreshOverview() {
      this.loading = true;
      try {
        const overview = await apiService.loadReceptionOverview();
        this.buildings = overview.buildings || [];
        this.present = overview.present || [];
        this.expected = overview.expected || [];
      } catch (error) {
        this.setMessage(error.message || "Reception non disponibile.", "error");
      } finally {
        this.loading = false;
      }
    },
    async startScanner() {
      this.scannerLoading = true;

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera non disponibile su questo browser o connessione.");
        }

        const { BrowserQRCodeReader } = await import("@zxing/browser");
        this.qrReader = new BrowserQRCodeReader();
        this.cameraActive = true;
        this.scannerControls = await this.qrReader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" }
            },
            audio: false
          },
          this.$refs.video,
          (result) => {
            const value = result?.getText();

            if (!value || value === this.lastScannedValue || this.checkInLoading) {
              return;
            }

            this.lastScannedValue = value;
            this.checkIn(value);
          }
        );
      } catch (error) {
        this.cameraActive = false;
        this.setMessage(error.message || "Impossibile avviare la camera.", "error");
      } finally {
        this.scannerLoading = false;
      }
    },
    stopScanner() {
      if (this.scannerControls) {
        this.scannerControls.stop();
      }

      if (this.qrReader) {
        this.qrReader = null;
      }

      this.scannerControls = null;
      this.cameraActive = false;
      this.lastScannedValue = "";
    },
    async checkIn(payload) {
      this.checkInLoading = true;

      try {
        const response = await apiService.receptionCheckIn(payload);
        this.setMessage(response.message || "Check-in registrato.", "success");
        await this.refreshOverview();
      } catch (error) {
        this.setMessage(error.message || "Check-in non valido.", "error");
      } finally {
        this.checkInLoading = false;
      }
    },
    setMessage(message, type = "success") {
      this.message = message;
      this.messageType = type;
    },
    formatDateTime(value) {
      const date = parseDateTime(value);
      return date
        ? new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(date)
        : "-";
    },
    formatTime(value) {
      const date = parseDateTime(value);
      return date
        ? new Intl.DateTimeFormat("it-IT", { timeStyle: "short" }).format(date)
        : "-";
    }
  }
};
</script>

<style scoped>
.reception-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(18rem, 0.9fr);
  gap: 1rem;
}

.scanner-panel {
  display: grid;
  gap: 1rem;
}

.scanner-frame {
  position: relative;
  min-height: 18rem;
  overflow: hidden;
  border: 1px solid var(--cm-border);
  border-radius: var(--cm-radius-sm);
  background: #0f172a;
}

.scanner-video,
.scanner-placeholder {
  width: 100%;
  height: 100%;
  min-height: 18rem;
}

.scanner-video {
  display: block;
  object-fit: cover;
}

.scanner-placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #e2e8f0;
  font-weight: 700;
}

.scanner-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.scanner-note {
  color: #64748b;
  font-size: 0.9rem;
}

.reception-stat-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.2rem;
}

.reception-stat-row > div {
  padding: 1rem;
  border: 1px solid var(--cm-border);
  border-radius: var(--cm-radius-sm);
}

.reception-stat-value,
.reception-stat-label {
  display: block;
}

.reception-stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1;
}

.reception-stat-label {
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.85rem;
}

.reception-list {
  display: grid;
  gap: 0.75rem;
}

.reception-list.compact {
  gap: 0.5rem;
}

.reception-row,
.reception-card {
  border: 1px solid var(--cm-border);
  border-radius: var(--cm-radius-sm);
  background: #fff;
}

.reception-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem;
}

.reception-row strong,
.reception-row span {
  display: block;
}

.reception-row span,
.reception-row small,
.reception-card p,
.reception-card small {
  color: #64748b;
}

.reception-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
}

.reception-card h3 {
  margin: 0.45rem 0 0.25rem;
  font-size: 1rem;
}

.reception-card p {
  margin: 0;
}

.reservation-presence-time {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 700;
}

@media (max-width: 900px) {
  .reception-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 575.98px) {
  .reception-card,
  .reception-row {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
