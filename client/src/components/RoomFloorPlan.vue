<template>
  <section class="floorplan-block">
    <div class="d-flex align-items-center justify-content-between gap-3 mb-2">
      <div>
        <h6 class="mb-0">Planimetria aula</h6>
        <small class="text-body-secondary">Seleziona il tavolo da prenotare</small>
      </div>
      <div class="floorplan-legend">
        <span><i class="legend-dot legend-free"></i>Libero</span>
        <span><i class="legend-dot legend-busy"></i>Occupato</span>
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
          getTableAvailability(table) ? 'is-free' : 'is-busy',
          selectedTableId === table.id ? 'is-selected' : ''
        ]"
        :style="getTableStyle(table)"
        :disabled="!getTableAvailability(table)"
        @click="$emit('select-table', table.id)"
      >
        <span class="table-code">{{ table.table_code }}</span>
        <span class="table-seats">{{ table.seats_count }} posti</span>
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
    }
  },
  emits: ["select-table"],
  methods: {
    getTableAvailability(table) {
      if (this.hasSlotAvailability) {
        return Boolean(table.is_available_for_slot);
      }

      return table.status === "available" && table.is_available_now !== false;
    },
    getTableStyle(table) {
      return {
        left: `${table.layout_x}%`,
        top: `${table.layout_y}%`,
        width: `${table.layout_width}%`,
        height: `${table.layout_height}%`,
        transform: `rotate(${table.layout_rotation}deg)`
      };
    }
  }
};
</script>
