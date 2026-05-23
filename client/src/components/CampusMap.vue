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
          availableSeats: 0
        };

        existing.roomsCount += 1;
        existing.totalSeats += Number(room.total_seats || 0);
        existing.availableSeats += Number(room.available_seats || 0);
        byCode.set(room.building_code, existing);
      }

      return Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code));
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
          icon: this.createMarkerIcon(building.name, building.code === this.selectedBuildingCode)
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

        marker.setIcon(this.createMarkerIcon(building.name, building.code === this.selectedBuildingCode));

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
    createMarkerIcon(name, isSelected) {
      const safeName = this.escapeHtml(name);

      return L.divIcon({
        className: "campus-leaflet-marker",
        html: `
          <span class="leaflet-building-pin ${isSelected ? "is-selected" : ""}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 21V8.4L12 3l8 5.4V21h-5v-6H9v6H4Z"></path>
              <path d="M10 10h4M7 13h2M15 13h2"></path>
            </svg>
            <strong title="${safeName}">${safeName}</strong>
          </span>
        `,
        iconSize: [210, 48],
        iconAnchor: [105, 48],
        popupAnchor: [0, -42]
      });
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
