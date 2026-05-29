<template>
  <section class="floorplan-block cm-card">
    <div class="d-flex align-items-center justify-content-between gap-3 mb-2">
      <div>
        <h6 class="mb-0">{{ title }}</h6>
        <small class="text-body-secondary">{{ subtitle }}</small>
      </div>
      <div class="floorplan-legend">
        <template v-if="readonly">
          <span><i class="legend-dot legend-present"></i>Check-in</span>
          <span><i class="legend-dot legend-free"></i>Vuoto</span>
        </template>
        <template v-else>
          <span><i class="legend-dot legend-free"></i>Libero</span>
          <span><i class="legend-dot legend-busy"></i>Occupato</span>
        </template>
      </div>
    </div>

    <div class="floorplan-canvas" aria-label="Planimetria aula">
      <div class="floorplan-door">Ingresso</div>

      <button
        v-for="table in tables"
        :key="table.id"
        type="button"
        :class="[
          'floorplan-table',
          table.is_group_table ? 'is-group' : 'is-single',
          getTableStatusClass(table),
          selectedTableId === table.id ? 'is-selected' : ''
        ]"
        :style="getTableStyle(table)"
        :disabled="readonly || !getTableAvailability(table)"
        :title="getTableTitle(table)"
        @click="$emit('select-table', table.id)"
      >
        <span class="table-code">{{ table.table_code }}</span>
        <span class="table-seats">{{ getTableSeatsLabel(table) }}</span>
      </button>
    </div>
  </section>
</template>

<script>
export default {
  name: "RoomFloorPlan",
  props: {
    tables: {
      type: Array,
      required: true
    },
    selectedTableId: {
      type: Number,
      default: null
    },
    hasSlotAvailability: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      default: "Planimetria aula"
    },
    subtitle: {
      type: String,
      default: "Seleziona il tavolo da prenotare"
    },
    readonly: {
      type: Boolean,
      default: false
    },
    occupancyByTable: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ["select-table"],
  methods: {
    getTableOccupants(table) {
      return this.occupancyByTable[table.id] || [];
    },
    getTableStatusClass(table) {
      if (this.getTableOccupants(table).length) {
        return "is-present";
      }

      return this.getTableAvailability(table) ? "is-free" : "is-busy";
    },
    getTableAvailability(table) {
      if (this.readonly) {
        return true;
      }

      if (this.hasSlotAvailability) {
        return Boolean(table.is_available_for_slot);
      }

      return table.status === "available" && table.is_available_now !== false;
    },
    getTableSeatsLabel(table) {
      const occupants = this.getTableOccupants(table);

      if (occupants.length > 1) {
        return `${occupants.length} presenti`;
      }

      if (occupants.length === 1) {
        return occupants[0].user_name;
      }

      if (this.hasSlotAvailability && table.available_seats_for_slot !== undefined) {
        return `${table.available_seats_for_slot}/${table.seats_count} liberi`;
      }

      if (table.available_seats_now !== undefined) {
        return `${table.available_seats_now}/${table.seats_count} liberi`;
      }

      return `${table.seats_count} posti`;
    },
    getTableTitle(table) {
      const occupants = this.getTableOccupants(table);

      if (!occupants.length) {
        return `Tavolo ${table.table_code}`;
      }

      return occupants.map((occupant) => occupant.user_name).join(", ");
    },
    getTableStyle(table) {
      return {
        left: `${table.layout_x}%`,
        top: `${table.layout_y}%`,
        width: `${table.layout_width}%`,
        height: `${table.layout_height}%`,
        transform: `translate(-50%, -50%) rotate(${table.layout_rotation}deg)`
      };
    }
  }
};
</script>
