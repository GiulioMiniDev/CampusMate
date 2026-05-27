<template>
  <section class="room-filters" aria-label="Filtri aule">
    <div class="room-filter-bar">
      <div class="room-filter-search">
        <Search class="room-filter-search-icon" aria-hidden="true" />
        <input
          :value="filters.query"
          type="search"
          class="room-filter-input"
          placeholder="Cerca..."
          autocomplete="off"
          @input="updateFilter('query', $event.target.value)"
        >
        <button
          v-if="filters.query"
          type="button"
          class="room-filter-clear"
          aria-label="Cancella ricerca"
          @click="updateFilter('query', '')"
        >
          <X aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        :class="['room-filter-toggle', filtersOpen ? 'is-open' : '', activeCount ? 'has-active' : '']"
        :aria-expanded="String(filtersOpen)"
        @click="filtersOpen = !filtersOpen"
      >
        <SlidersHorizontal aria-hidden="true" />
        Filtri
        <span v-if="activeCount" class="room-filter-badge">{{ activeCount }}</span>
      </button>
    </div>

    <div v-show="filtersOpen" class="room-filter-panel">
      <div class="room-filter-group">
        <div class="room-filter-group-title">Orari e disponibilita</div>
        <div class="room-filter-strip" aria-label="Filtri disponibilita e orari">
          <button
            type="button"
            :class="['room-filter-chip', filters.onlyAvailable ? 'is-active' : '']"
            @click="updateFilter('onlyAvailable', !filters.onlyAvailable)"
          >
            <CheckCircle2 aria-hidden="true" />
            Posti liberi
          </button>

          <button
            v-for="option in closingOptions"
            :key="option.value"
            type="button"
            :class="['room-filter-chip', filters.closing === option.value ? 'is-active' : '']"
            @click="toggleClosing(option.value)"
          >
            <Clock3 aria-hidden="true" />
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="room-filter-group">
        <div class="room-filter-group-title">Servizi</div>
        <div class="room-filter-strip" aria-label="Filtri servizi">
          <button
            v-for="service in visibleServiceOptions"
            :key="service"
            type="button"
            :class="['room-filter-chip', filters.services.includes(service) ? 'is-active' : '']"
            @click="toggleService(service)"
          >
            <span class="room-filter-service-icon" aria-hidden="true" v-html="getServiceIcon(service)"></span>
            {{ service }}
          </button>
        </div>
      </div>

      <div v-if="activeCount" class="room-filter-summary">
        <span>{{ resultCount }} di {{ totalCount }} aule</span>
        <button type="button" class="room-filter-reset" @click="$emit('reset')">
          <X aria-hidden="true" />
          Reset
        </button>
      </div>
    </div>
  </section>
</template>

<script>
import { CheckCircle2, Clock3, Search, SlidersHorizontal, X } from "@lucide/vue";

export default {
  name: "RoomFilters",
  components: {
    CheckCircle2,
    Clock3,
    Search,
    SlidersHorizontal,
    X
  },
  props: {
    filters: {
      type: Object,
      required: true
    },
    serviceOptions: {
      type: Array,
      required: true
    },
    activeCount: {
      type: Number,
      required: true
    },
    resultCount: {
      type: Number,
      required: true
    },
    totalCount: {
      type: Number,
      required: true
    }
  },
  emits: ["update:filters", "reset"],
  data() {
    return {
      filtersOpen: false,
      closingOptions: [
        { value: "after18", label: "Dopo le 18" },
        { value: "after20", label: "Dopo le 20" },
        { value: "weekend", label: "Weekend" }
      ]
    };
  },
  computed: {
    visibleServiceOptions() {
      return this.serviceOptions.slice(0, 10);
    }
  },
  methods: {
    updateFilter(key, value) {
      this.$emit("update:filters", {
        ...this.filters,
        [key]: value
      });
    },
    toggleService(service) {
      const services = this.filters.services.includes(service)
        ? this.filters.services.filter((item) => item !== service)
        : [...this.filters.services, service];

      this.updateFilter("services", services);
    },
    toggleClosing(value) {
      this.updateFilter("closing", this.filters.closing === value ? "" : value);
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

      return `<svg xmlns="http://www.w3.org/2000/svg" class="room-filter-service-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`;
    }
  }
};
</script>
