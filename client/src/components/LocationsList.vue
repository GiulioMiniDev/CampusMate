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
      <article v-for="building in visibleBuildings" :key="building.code" class="location-group" :class="{ 'is-expanded': expandedBuilding === building.code }" @click="toggleBuilding(building.code)">
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
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong class="cm-chip cm-chip-success">{{ building.availableSeats }}/{{ building.totalSeats }}</strong>
              <svg v-if="expandedBuilding === building.code" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

          <div v-if="expandedBuilding !== building.code" class="location-compact-details">
            <div class="location-compact-row location-compact-row-hours">
              <span class="location-compact-label">
                <svg xmlns="http://www.w3.org/2000/svg" class="location-compact-label-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>Orari</span>
              </span>
              <div class="location-compact-items">
                <span v-if="building.weekdayHours" class="location-compact-pill">
                  <svg xmlns="http://www.w3.org/2000/svg" class="location-service-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  {{ building.weekdayHours }}
                </span>
                <span v-if="building.weekendHours" class="location-compact-pill">Weekend {{ building.weekendHours }}</span>
              </div>
            </div>

            <div v-if="building.services.length" class="location-compact-row location-compact-row-services">
              <span class="location-compact-label">
                <svg xmlns="http://www.w3.org/2000/svg" class="location-compact-label-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4 8 4Z"></path><path d="M9 12l2 2 4-4"></path></svg>
                <span>Servizi</span>
              </span>
              <div class="location-compact-items">
                <span v-for="service in building.services" :key="service" class="location-compact-pill location-compact-pill-success">
                  <span class="location-service-chip-icon" aria-hidden="true" v-html="getServiceIcon(service)"></span>
                  {{ service }}
                </span>
              </div>
            </div>

            <div class="location-compact-row location-compact-row-rooms">
              <span class="location-compact-label">
                <svg xmlns="http://www.w3.org/2000/svg" class="location-compact-label-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M8 7h8"></path><path d="M8 11h8"></path><path d="M8 15h5"></path></svg>
                <span>Aule</span>
              </span>
              <div class="location-room-chip-list">
                <span v-for="room in building.rooms" :key="room.id" class="location-room-chip">
                  <strong>{{ room.name }}</strong>
                  <span>{{ room.available_seats }}/{{ room.total_seats }}</span>
                </span>
              </div>
            </div>
          </div>

        </div>

        <div v-show="expandedBuilding === building.code" class="location-expanded-content" @click.stop>
          <div class="location-expanded-heading">
            <span>Seleziona aula</span>
            <small>{{ building.rooms.length }} aule, {{ building.availableSeats }}/{{ building.totalSeats }} posti liberi</small>
          </div>

          <div class="location-room-options">
            <button
              v-for="room in building.rooms"
              :key="room.id"
              type="button"
              class="location-room-option"
              :disabled="room.available_seats === 0"
              @click.stop="$emit('reserve', room.id)"
            >
              <div>
                <strong>{{ room.name }}</strong>
                <span>Piano {{ room.floor }} - {{ getRoomStatus(room) }}</span>
              </div>
              <strong class="location-room-option-seats">{{ room.available_seats }}/{{ room.total_seats }}</strong>
            </button>
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
      failedImages: {},
      expandedBuilding: null
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
  watch: {
    selectedBuildingCode: {
      immediate: true,
      handler(code) {
        if (code) {
          this.expandedBuilding = code;
        }
      }
    }
  },
  methods: {
    toggleBuilding(code) {
      if (this.expandedBuilding === code) {
        this.expandedBuilding = null;
      } else {
        this.expandedBuilding = code;
      }
    },
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
    },
    getServiceIconDefinition(service) {
      if (!service) {
        return null;
      }

      const normalized = service
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const definitions = [
        {
          keywords: ["wifi", "wi-fi", "wireless"],
          icon: `<path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><circle cx="12" cy="20" r="1"></circle>`
        },
        {
          keywords: ["prese", "presa", "corrente", "elettric"],
          icon: `<path d="M8 2v6"></path><path d="M16 2v6"></path><path d="M12 17v5"></path><path d="M8 22h8"></path><rect x="6" y="8" width="12" height="9" rx="2"></rect>`
        },
        {
          keywords: ["accessibil", "disabili", "ascensore", "barriere"],
          icon: `<circle cx="9" cy="5" r="2"></circle><path d="M10 22a7 7 0 1 1 4.95-11.95"></path><path d="M11 9h3l1 5h4"></path><path d="M11 9v6"></path><path d="M7 15h6"></path>`
        },
        {
          keywords: ["aria", "clima", "condizionata", "ventilazione"],
          icon: `<path d="M3 8h12a3 3 0 1 0-3-3"></path><path d="M4 14h14a3 3 0 1 1-3 3"></path><path d="M2 20h9a2 2 0 1 1-2 2"></path>`
        },
        {
          keywords: ["computer", "lab", "pc", "informatica"],
          icon: `<rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8"></path><path d="M12 16v4"></path>`
        },
        {
          keywords: ["tavoli da disegno", "disegno", "progetto", "architettura"],
          icon: `<path d="M4 20h16"></path><path d="M6 20l6-16 6 16"></path><path d="M8 14h8"></path><path d="M10 9h4"></path>`
        },
        {
          keywords: ["fotocopia", "fotocopiatrici", "stampante", "stampa", "printer"],
          icon: `<polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect>`
        },
        {
          keywords: ["riscaldamento", "calore", "termosifone"],
          icon: `<path d="M8 14a4 4 0 1 0 8 0c0-2-2-3-2-5V5a2 2 0 0 0-4 0v4c0 2-2 3-2 5Z"></path><path d="M12 14v.01"></path>`
        },
        {
          keywords: ["silenz", "acustic", "quiet"],
          icon: `<path d="M11 5 6 9H2v6h4l5 4V5Z"></path><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line>`
        },
        {
          keywords: ["biblioteca", "lettura", "libri", "consultazione"],
          icon: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z"></path>`
        },
        {
          keywords: ["gruppo", "team", "collaborazione"],
          icon: `<path d="M16 21v-2a4 4 0 0 0-8 0v2"></path><circle cx="12" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`
        },
        {
          keywords: ["proiettore", "lavagna", "schermo", "presentazione"],
          icon: `<rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M12 16v4"></path><path d="M8 20h8"></path><path d="M8 9h8"></path><path d="M8 12h5"></path>`
        },
        {
          keywords: ["bar", "caffe", "ristoro"],
          icon: `<path d="M10 2v2"></path><path d="M14 2v2"></path><path d="M16 8h1a4 4 0 0 1 0 8h-1"></path><path d="M4 8h12v5a6 6 0 0 1-12 0V8Z"></path><path d="M6 20h8"></path>`
        },
        {
          keywords: ["parcheggio", "parking"],
          icon: `<rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M9 17V7h5a3 3 0 0 1 0 6H9"></path>`
        },
        {
          keywords: ["locker", "armadietti", "deposito"],
          icon: `<rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M12 3v18"></path><path d="M8 11h1"></path><path d="M15 11h1"></path>`
        },
        {
          keywords: ["bagni", "toilette", "servizi igienici"],
          icon: `<circle cx="9" cy="4" r="2"></circle><path d="M9 6v15"></path><path d="M5 11h8"></path><circle cx="17" cy="4" r="2"></circle><path d="M17 6v15"></path><path d="M14 11h6"></path>`
        }
      ];

      return definitions.find((definition) => definition.keywords.some((keyword) => normalized.includes(keyword)));
    },
    getServiceIcon(service) {
      const definition = this.getServiceIconDefinition(service);
      const icon = definition?.icon || `<path d="M12 3l8 4v6c0 5-3.4 7.7-8 9-4.6-1.3-8-4-8-9V7l8-4Z"></path><path d="M9 12l2 2 4-4"></path>`;

      return `<svg xmlns="http://www.w3.org/2000/svg" class="location-service-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`;
    }
  }
};
</script>

<style scoped>
.location-group {
  cursor: pointer;
  height: auto !important; /* Overriding global fixed height */
  transition: all 0.2s ease;
  align-items: stretch;
}
.location-group:hover {
  transform: translateY(-2px);
  box-shadow: var(--cm-shadow-lg) !important;
}
.location-cover, .room-cover-placeholder {
  height: 100% !important;
  max-height: 120px !important;
  align-self: flex-start;
}
.location-heading > div {
  min-width: 0;
}
@media (min-width: 1024px) {
  .location-cover, .room-cover-placeholder {
    max-height: 100% !important;
    height: 154px !important;
  }
}
.location-compact-rooms {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--cm-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Truncate if too long */
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.location-compact-details {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.55rem;
}
.location-compact-row {
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr);
  gap: 0.6rem;
  align-items: start;
  min-width: 0;
}
.location-compact-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--cm-muted);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  line-height: 1.7;
  text-transform: uppercase;
}
.location-compact-label-icon {
  flex: 0 0 auto;
}
.location-compact-items,
.location-room-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  min-width: 0;
}
.location-compact-pill,
.location-room-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  max-width: 100%;
  border: 1px solid #dbe4f0;
  border-radius: 999px;
  padding: 0.18rem 0.48rem;
  background: var(--cm-muted-soft);
  color: #475569;
  font-size: 0.74rem;
  line-height: 1.25;
}
.location-compact-pill-success {
  border-color: var(--cm-success-border);
  background: var(--cm-success-soft);
  color: var(--cm-success);
}
.location-room-chip strong {
  min-width: 0;
  overflow: hidden;
  color: #334155;
  font-size: inherit;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.location-room-chip span {
  flex: 0 0 auto;
  color: var(--cm-muted);
}
.location-expanded-content {
  grid-column: 1 / -1;
  margin-top: 0;
  border-top: 1px solid var(--cm-border);
  padding: 0.9rem 1.25rem 1.1rem;
}
.location-expanded-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.65rem;
}
.location-expanded-heading span {
  color: var(--cm-ink);
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.location-expanded-heading small {
  color: var(--cm-muted);
  font-size: 0.76rem;
}
.location-room-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}
.location-room-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-width: 0;
  border: 1px solid #dbe4f0;
  border-radius: var(--cm-radius-sm);
  padding: 0.65rem 0.75rem;
  background: #ffffff;
  color: inherit;
  text-align: left;
  transition: border-color var(--cm-transition), background-color var(--cm-transition), box-shadow var(--cm-transition), transform var(--cm-transition);
}
.location-room-option:hover:not(:disabled),
.location-room-option:focus {
  border-color: var(--cm-accent);
  background: #f8fbff;
  box-shadow: 0 8px 18px rgba(13, 110, 253, 0.08);
  transform: translateY(-1px);
}
.location-room-option:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}
.location-room-option div {
  min-width: 0;
}
.location-room-option strong,
.location-room-option span {
  display: block;
}
.location-room-option div strong {
  overflow: hidden;
  color: var(--cm-ink);
  font-size: 0.86rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.location-room-option div span {
  margin-top: 0.12rem;
  color: var(--cm-muted);
  font-size: 0.74rem;
}
.location-room-option-seats {
  flex: 0 0 auto;
  border: 1px solid var(--cm-success-border);
  border-radius: 999px;
  padding: 0.28rem 0.5rem;
  background: var(--cm-success-soft);
  color: var(--cm-success);
  font-size: 0.76rem;
}
.location-service-icons,
.location-service-icon,
.location-service-chip,
.location-service-chip-icon {
  display: inline-flex;
  align-items: center;
}
.location-service-icons {
  gap: 6px;
}
.location-service-icon {
  color: var(--cm-success);
}
.location-service-chip {
  gap: 6px;
}
.location-service-chip-icon {
  flex: 0 0 auto;
}
:deep(.location-service-svg) {
  display: block;
}
@media (min-width: 1024px) {
  .location-group {
    grid-template-columns: 200px minmax(0, 1fr) !important; /* Smaller image width than before */
  }
}
@media (max-width: 900px) {
  .location-room-options {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 575.98px) {
  .locations-list {
    gap: 0.65rem;
  }

  .location-group {
    grid-template-columns: minmax(7.6rem, 38%) minmax(0, 1fr) !important;
    border-radius: var(--cm-radius-sm);
  }

  .location-cover,
  .room-cover-placeholder {
    width: 100% !important;
    height: 100% !important;
    min-height: 9.25rem;
    max-height: none !important;
    align-self: stretch;
    border-radius: 0;
  }

  .location-group.is-expanded .location-cover,
  .location-group.is-expanded .room-cover-placeholder {
    height: 9.25rem !important;
    max-height: 9.25rem !important;
    align-self: start;
  }

  .room-cover-placeholder span {
    width: 3.8rem;
    height: 3.8rem;
    font-size: 0.82rem;
  }

  .location-content {
    padding: 0.55rem 0.55rem 0.6rem;
  }

  .location-heading {
    gap: 0.35rem;
  }

  .location-heading h3 {
    display: -webkit-box;
    font-size: 0.9rem;
    line-height: 1.16;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .location-heading p {
    display: -webkit-box;
    margin-top: 0.08rem;
    font-size: 0.68rem;
    line-height: 1.22;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .location-heading strong {
    padding: 0.18rem 0.42rem;
    font-size: 0.68rem;
  }

  .location-heading svg {
    width: 16px;
    height: 16px;
  }

  .location-compact-details {
    gap: 0.2rem;
    margin-top: 0.32rem;
  }

  .location-compact-row {
    grid-template-columns: 1rem minmax(0, 1fr);
    gap: 0.26rem;
    align-items: start;
  }

  .location-compact-label {
    justify-content: center;
    padding-top: 0.1rem;
    font-size: 0;
    line-height: 1;
  }

  .location-compact-label-icon {
    width: 12px;
    height: 12px;
  }

  .location-compact-items,
  .location-room-chip-list {
    gap: 0.2rem;
  }

  .location-compact-pill,
  .location-room-chip {
    gap: 0.18rem;
    padding: 0.08rem 0.3rem;
    font-size: 0.62rem;
    line-height: 1.18;
  }

  :deep(.location-service-svg) {
    width: 12px;
    height: 12px;
  }

  .location-expanded-content {
    padding: 0.7rem 0.75rem 0.8rem;
  }

  .location-expanded-heading {
    gap: 0.4rem;
    margin-bottom: 0.5rem;
  }

  .location-room-option {
    padding: 0.52rem 0.6rem;
  }
}
</style>
