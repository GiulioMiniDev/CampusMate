<template>
  <section class="campus-map">
    <div class="campus-map-header">
      <div>
        <h2 class="h4 mb-1">Mappa sedi</h2>
        <p class="campus-map-kicker mb-0">
          Sapienza - {{ buildings.length }} edifici
          <span v-if="userPosition"> - posizione rilevata</span>
        </p>
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

    <div ref="mapContainer" class="campus-map-canvas" aria-label="Mappa sedi Sapienza"></div>
  </section>
</template>

<script>
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default {
  name: "CampusMap",
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
  emits: ["select-building", "clear-selection"],
  data() {
    return {
      map: null,
      markers: new Map(),
      userMarker: null,
      userPosition: null
    };
  },
  computed: {
    buildings() {
      const byCode = new Map();

      for (const room of this.rooms) {
        if (!room.building_code || room.latitude === null || room.longitude === null) {
          continue;
        }

        const existing = byCode.get(room.building_code) || {
          code: room.building_code,
          name: room.building,
          address: room.address,
          campusArea: room.campus_area,
          latitude: Number(room.latitude),
          longitude: Number(room.longitude),
          roomsCount: 0,
          totalSeats: 0,
          availableSeats: 0,
          services: new Set()
        };

        existing.roomsCount += 1;
        existing.totalSeats += Number(room.total_seats || 0);
        existing.availableSeats += Number(room.available_seats || 0);
        for (const service of room.services || []) {
          existing.services.add(service);
        }
        byCode.set(room.building_code, existing);
      }

      return Array.from(byCode.values())
        .map((building) => ({
          ...building,
          services: Array.from(building.services)
        }))
        .sort((a, b) => a.code.localeCompare(b.code));
    }
  },
  watch: {
    buildings: {
      handler() {
        this.renderMarkers();
      },
      deep: true
    },
    selectedBuildingCode() {
      this.syncSelectedMarker();
    }
  },
  mounted() {
    this.initMap();
    this.renderMarkers();
    this.requestUserLocation();
  },
  beforeUnmount() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  },
  methods: {
    initMap() {
      if (this.map || !this.$refs.mapContainer) {
        return;
      }

      this.map = L.map(this.$refs.mapContainer, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([41.9028, 12.4964], 13);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(this.map);
    },
    renderMarkers() {
      if (!this.map) {
        return;
      }

      for (const marker of this.markers.values()) {
        marker.remove();
      }

      this.markers.clear();

      const bounds = [];

      for (const building of this.buildings) {
        const marker = L.marker([building.latitude, building.longitude], {
          icon: this.createMarkerIcon(building, building.code === this.selectedBuildingCode)
        })
          .addTo(this.map)
          .on("click", () => this.$emit("select-building", building.code));

        this.markers.set(building.code, marker);
        bounds.push([building.latitude, building.longitude]);
      }

      if (this.userPosition) {
        bounds.push([this.userPosition.latitude, this.userPosition.longitude]);
      }

      if (bounds.length > 0) {
        this.map.fitBounds(bounds, {
          padding: [42, 42],
          maxZoom: 15
        });
      }
    },
    syncSelectedMarker() {
      for (const building of this.buildings) {
        const marker = this.markers.get(building.code);

        if (!marker) {
          continue;
        }

        marker.setIcon(this.createMarkerIcon(building, building.code === this.selectedBuildingCode));

        if (building.code === this.selectedBuildingCode) {
          this.map.panTo([building.latitude, building.longitude]);
        }
      }
    },
    requestUserLocation() {
      if (!navigator.geolocation) {
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          this.renderUserMarker();
          this.renderMarkers();
        },
        () => {},
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000
        }
      );
    },
    renderUserMarker() {
      if (!this.map || !this.userPosition) {
        return;
      }

      if (this.userMarker) {
        this.userMarker.remove();
      }

      this.userMarker = L.marker([this.userPosition.latitude, this.userPosition.longitude], {
        icon: L.divIcon({
          className: "campus-user-marker",
          html: '<span class="leaflet-user-pin"><i></i><strong>Tu</strong></span>',
          iconSize: [58, 38],
          iconAnchor: [29, 19]
        })
      }).addTo(this.map);
    },
    createMarkerIcon(building, isSelected) {
      const safeName = this.escapeHtml(building.name);
      const serviceIcons = building.services.slice(0, 3)
        .map((service) => `<span title="${this.escapeHtml(service)}">${this.getServiceIcon(service)}</span>`)
        .join("");
      const extraServices = building.services.length > 3 ? `<em>+${building.services.length - 3}</em>` : "";

      return L.divIcon({
        className: "campus-leaflet-marker",
        html: `
          <span class="leaflet-building-pin ${isSelected ? "is-selected" : ""}">
            <span class="leaflet-building-pin-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 21V8.4L12 3l8 5.4V21h-5v-6H9v6H4Z"></path>
                <path d="M10 10h4M7 13h2M15 13h2"></path>
              </svg>
            </span>
            <span class="leaflet-building-pin-body">
              <strong title="${safeName}">${safeName}</strong>
              <small>${building.availableSeats}/${building.totalSeats} posti - ${building.roomsCount} aule</small>
            </span>
            <span class="leaflet-building-pin-services">${serviceIcons}${extraServices}</span>
          </span>
        `,
        iconSize: [250, 58],
        iconAnchor: [125, 58],
        popupAnchor: [0, -42]
      });
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
          keywords: ["silenz", "acustic", "quiet"],
          icon: `<path d="M11 5 6 9H2v6h4l5 4V5Z"></path><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line>`
        },
        {
          keywords: ["biblioteca", "lettura", "libri", "consultazione"],
          icon: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z"></path>`
        }
      ];

      return definitions.find((definition) => definition.keywords.some((keyword) => normalized.includes(keyword)));
    },
    getServiceIcon(service) {
      const definition = this.getServiceIconDefinition(service);
      const icon = definition?.icon || `<path d="M12 3l8 4v6c0 5-3.4 7.7-8 9-4.6-1.3-8-4-8-9V7l8-4Z"></path><path d="M9 12l2 2 4-4"></path>`;

      return `<svg xmlns="http://www.w3.org/2000/svg" class="leaflet-building-service-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`;
    },
    escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }
  }
};
</script>
