<template>
  <div>
    <section v-if="!selectedBuilding" class="row g-4">
      <div class="col-md-7">
        <div class="cm-panel">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="h5 mb-0">Edifici</h1>
          </div>
          <div v-if="adminMessage" class="cm-alert cm-alert-danger mb-3">{{ adminMessage }}</div>
          <div v-if="buildings.length === 0" class="cm-alert cm-alert-info">Nessun edificio disponibile.</div>
          <div v-else class="list-group">
            <div
              v-for="building in buildings"
              :key="building.id"
              class="list-group-item d-flex justify-content-between align-items-center"
            >
              <div class="flex-grow-1" style="cursor: pointer;" @click="selectBuilding(building)">
                <strong class="d-block">{{ building.name }}</strong>
                <small class="text-body-secondary">{{ building.code }} - {{ building.campus_area || building.address }}</small>
              </div>
              <div>
                <button type="button" @click="editBuilding(building)" class="cm-button cm-button-sm cm-button-outline me-2">Modifica</button>
                <button type="button" @click="selectBuilding(building)" class="cm-button cm-button-sm cm-button-outline">Gestisci Aule</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-5">
        <div class="cm-panel">
          <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="h6 mb-3">{{ editingBuildingId ? 'Modifica Edificio' : 'Aggiungi Edificio' }}</h2>
            <button v-if="editingBuildingId" type="button" @click="cancelBuildingEdit" class="btn btn-sm btn-link text-decoration-none">Annulla</button>
          </div>
          <form @submit.prevent="submitBuilding">
            <div class="mb-3">
              <label for="buildingName" class="form-label">Nome Edificio</label>
              <input v-model="buildingForm.name" type="text" class="form-control" id="buildingName" required>
            </div>
            <div class="mb-3">
              <label for="buildingCode" class="form-label">Codice</label>
              <input v-model="buildingForm.code" type="text" class="form-control" id="buildingCode" required>
            </div>
            <div class="mb-3">
              <label for="buildingAddress" class="form-label">Indirizzo</label>
              <input v-model="buildingForm.address" type="text" class="form-control" id="buildingAddress">
            </div>
            <div class="mb-3">
              <label for="campusArea" class="form-label">Area campus</label>
              <input v-model="buildingForm.campus_area" type="text" class="form-control" id="campusArea">
            </div>
            <div class="mb-3">
              <label for="imageUrl" class="form-label">URL immagine</label>
              <input v-model="buildingForm.image_url" type="url" class="form-control" id="imageUrl">
            </div>
            <div class="mb-3">
              <label for="servicesText" class="form-label">Servizi</label>
              <input v-model="buildingForm.services_text" type="text" class="form-control" id="servicesText" placeholder="wifi, prese, stampante">
            </div>
            <div class="row">
              <div class="col-6 mb-3">
                <label for="weekdayHours" class="form-label">Orari feriali</label>
                <input v-model="buildingForm.weekday_hours" type="text" class="form-control" id="weekdayHours" placeholder="08:00-20:00">
              </div>
              <div class="col-6 mb-3">
                <label for="weekendHours" class="form-label">Orari weekend</label>
                <input v-model="buildingForm.weekend_hours" type="text" class="form-control" id="weekendHours" placeholder="09:00-18:00">
              </div>
            </div>
            <div class="row">
              <div class="col-6 mb-3">
                <label for="openingTime" class="form-label">Apertura</label>
                <input v-model="buildingForm.opening_time" type="time" class="form-control" id="openingTime">
              </div>
              <div class="col-6 mb-3">
                <label for="closingTime" class="form-label">Chiusura</label>
                <input v-model="buildingForm.closing_time" type="time" class="form-control" id="closingTime">
              </div>
            </div>
            <div v-if="editingBuildingId" class="mb-3">
              <label for="buildingStatus" class="form-label">Stato</label>
              <select v-model="buildingForm.status" class="form-select" id="buildingStatus" required>
                <option value="open">Aperto</option>
                <option value="closed">Chiuso</option>
                <option value="maintenance">Manutenzione</option>
              </select>
            </div>
            <button type="submit" class="cm-button cm-button-primary w-100" :disabled="isLoading">
              {{ editingBuildingId ? 'Salva Edificio' : 'Crea Edificio' }}
            </button>
          </form>
          <div v-if="buildingMessage" class="mt-3 cm-alert cm-alert-success">{{ buildingMessage }}</div>
        </div>
      </div>
    </section>

    <section v-else-if="!selectedRoom" class="row g-4">
      <div class="col-md-7">
        <div class="cm-panel">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 class="h5 mb-1">Aule in {{ selectedBuilding.name }}</h1>
              <small class="text-body-secondary">{{ selectedBuilding.code }}</small>
            </div>
            <button type="button" @click="goBackToBuildings" class="cm-button cm-button-sm cm-button-outline">Edifici</button>
          </div>
          <div v-if="buildingRooms.length === 0" class="cm-alert cm-alert-info">Nessuna aula in questo edificio.</div>
          <div v-else class="list-group">
            <div
              v-for="r in buildingRooms" 
              :key="r.id" 
              class="list-group-item d-flex justify-content-between align-items-center"
            >
              <div class="flex-grow-1" style="cursor: pointer;" @click="selectRoom(r)">
                <strong class="d-block">{{ r.name }} ({{ r.room_code }})</strong>
                <small class="text-body-secondary">Piano: {{ r.floor }} | Posti Totali: {{ r.total_seats }}</small>
              </div>
              <div>
                <button type="button" @click="editRoom(r)" class="cm-button cm-button-sm cm-button-outline me-2">Modifica</button>
                <button type="button" @click="selectRoom(r)" class="cm-button cm-button-sm cm-button-outline">Gestisci Tavoli</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-5">
        <div class="cm-panel">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="h5 mb-0">{{ editingRoomId ? 'Modifica Aula' : 'Aggiungi Aula' }}</h2>
            <button v-if="editingRoomId" @click="cancelRoomEdit" class="btn btn-sm btn-link text-decoration-none">Annulla</button>
          </div>
          <form @submit.prevent="submitRoom">
            <!-- Rimosso select building, lo prendiamo dal contesto -->
            <div class="mb-3">
              <label for="roomName" class="form-label">Nome Aula</label>
              <input v-model="roomForm.name" type="text" class="form-control" id="roomName" required>
            </div>
            <div class="mb-3">
              <label for="roomCode" class="form-label">Codice Aula</label>
              <input v-model="roomForm.room_code" type="text" class="form-control" id="roomCode" required>
            </div>
            <div class="mb-3">
              <label for="floorLabel" class="form-label">Piano</label>
              <input v-model="roomForm.floor_label" type="text" class="form-control" id="floorLabel" required>
            </div>
            <div class="mb-3">
              <label for="roomDescription" class="form-label">Descrizione</label>
              <textarea v-model="roomForm.description" class="form-control" id="roomDescription"></textarea>
            </div>
            <div v-if="editingRoomId" class="mb-3">
              <label for="roomStatus" class="form-label">Stato</label>
              <select v-model="roomForm.status" class="form-select" id="roomStatus" required>
                <option value="open">Aperta</option>
                <option value="closed">Chiusa</option>
                <option value="maintenance">Manutenzione</option>
              </select>
            </div>

            <button type="submit" class="cm-button cm-button-primary w-100" :disabled="isLoading">
              {{ editingRoomId ? 'Salva Modifiche Aula' : 'Crea Aula' }}
            </button>
          </form>
          <div v-if="roomMessage" class="mt-3 cm-alert cm-alert-success">{{ roomMessage }}</div>
        </div>
      </div>
    </section>

    <section v-else class="row g-4">
      <div class="col-md-6">
        <div class="cm-panel">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 class="h5 mb-1">Tavoli in {{ selectedRoom.name }}</h1>
              <small class="text-body-secondary">{{ selectedBuilding.name }} - Piano {{ selectedRoom.floor }}</small>
            </div>
            <button type="button" @click="goBackToBuilding" class="cm-button cm-button-sm cm-button-outline">Aule</button>
          </div>
          <div class="admin-layout-preview" aria-label="Planimetria">
            <div class="floorplan-canvas admin-canvas mb-3" style="position: relative; height: 350px; width: 100%; border-radius:8px">
              <div class="floorplan-door">Ingresso</div>
              
              <div 
                v-for="t in currentRoomTables" 
                :key="t.id"
                class="floorplan-table" 
                :class="{ 'is-group': t.is_group_table, 'is-single': !t.is_group_table, 'is-busy': true }"
                :style="getExistingTableStyle(t)"
                style="opacity: 0.6; cursor: pointer;"
                @click="editTable(t)"
              >
                <span class="table-code">{{ t.table_code }}</span>
                <span class="table-seats">{{ t.seats_count }}</span>
              </div>

              <div 
                class="floorplan-table is-free is-selected" 
                :class="{ 'is-group': tableForm.is_group_table, 'is-single': !tableForm.is_group_table }"
                :style="previewStyle"
                style="z-index: 10; box-shadow: 0 0 0 3px var(--cm-primary); transition: left 0.1s, top 0.1s;"
              >
                <span class="table-code">{{ tableForm.table_code || 'Nuovo' }}</span>
                <span class="table-seats">{{ tableForm.seats_count }} posti</span>
              </div>
            </div>
          </div>
          <p class="text-body-secondary small mb-0">Tavoli nell'aula: {{ currentRoomTables.length }}. Clicca su un tavolo sbiadito per modificarlo.</p>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="cm-panel">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="h5 mb-0">{{ editingTableId ? 'Modifica Tavolo' : 'Aggiungi Tavolo / Postazione' }}</h2>
          <button v-if="editingTableId" type="button" @click="cancelTableEdit" class="btn btn-sm btn-link text-decoration-none">Annulla</button>
        </div>
        <form @submit.prevent="submitTable">
          <div class="row">
            <div class="col-6 mb-3">
              <label for="tableCode" class="form-label">Codice Tavolo</label>
              <input v-model="tableForm.table_code" type="text" class="form-control" id="tableCode" required>
            </div>
            <div class="col-6 mb-3">
              <label for="seatsCount" class="form-label">Numero di Posti</label>
              <input v-model.number="tableForm.seats_count" type="number" class="form-control" id="seatsCount" min="1" required>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Tipo di Tavolo</label>
            <div>
              <label class="form-check-label me-3">
                <input 
                  type="radio" 
                  :value="false" 
                  v-model="tableForm.is_group_table" 
                  class="form-check-input"
                  @change="updateTableType"
                >
                Singolo
              </label>
              <label class="form-check-label">
                <input 
                  type="radio" 
                  :value="true" 
                  v-model="tableForm.is_group_table" 
                  class="form-check-input"
                  @change="updateTableType"
                >
                Gruppo
              </label>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-check-label">
              <input v-model="tableForm.has_power_outlet" type="checkbox" class="form-check-input">
              Presa elettrica
            </label>
          </div>
          <div class="row">
            <div class="col-6 mb-3">
              <label for="layoutX" class="form-label">X layout</label>
              <input v-model.number="tableForm.layout_x" type="number" min="0" max="100" step="0.01" class="form-control" id="layoutX">
            </div>
            <div class="col-6 mb-3">
              <label for="layoutY" class="form-label">Y layout</label>
              <input v-model.number="tableForm.layout_y" type="number" min="0" max="100" step="0.01" class="form-control" id="layoutY">
            </div>
            <div class="col-6 mb-3">
              <label for="layoutWidth" class="form-label">Larghezza layout</label>
              <input v-model.number="tableForm.layout_width" type="number" min="1" max="100" step="0.01" class="form-control" id="layoutWidth">
            </div>
            <div class="col-6 mb-3">
              <label for="layoutHeight" class="form-label">Altezza layout</label>
              <input v-model.number="tableForm.layout_height" type="number" min="1" max="100" step="0.01" class="form-control" id="layoutHeight">
            </div>
            <div class="col-6 mb-3">
              <label for="layoutRotation" class="form-label">Rotazione</label>
              <input v-model.number="tableForm.layout_rotation" type="number" step="1" class="form-control" id="layoutRotation">
            </div>
            <div v-if="editingTableId" class="col-6 mb-3">
              <label for="tableStatus" class="form-label">Stato</label>
              <select v-model="tableForm.status" class="form-select" id="tableStatus" required>
                <option value="available">Disponibile</option>
                <option value="unavailable">Non disponibile</option>
                <option value="maintenance">Manutenzione</option>
              </select>
            </div>
          </div>

          <button type="submit" class="cm-button cm-button-primary w-100" :disabled="isLoading">
            {{ editingTableId ? 'Salva Modifiche Tavolo' : 'Crea Tavolo nell\'Aula' }}
          </button>
        </form>
        <div v-if="tableMessage" class="mt-3 cm-alert cm-alert-success">{{ tableMessage }}</div>
      </div>
      </div>
    </section>
  </div>
</template>

<script>
import { state } from "../store.js";
import { apiService } from "../api.js";

export default {
  name: "AdminDashboard",
  data() {
    return {
      buildings: [],
      currentRoomTables: [],
      isLoading: false,
      selectedBuilding: null,
      selectedRoom: null,
      editingBuildingId: null,
      editingRoomId: null,
      editingTableId: null,
      addressSuggestions: [],
      addressSearchTimeout: null,
      adminMessage: "",
      buildingForm: {
        name: "",
        code: "",
        address: "",
        campus_area: "",
        image_url: "",
        latitude: null,
        longitude: null,
        weekday_hours: "",
        weekend_hours: "",
        services_text: "",
        opening_time: "",
        closing_time: "",
        status: "open"
      },
      roomForm: {
        building_id: null,
        name: "",
        room_code: "",
        floor_label: "",
        description: "",
        status: "open"
      },
      tableForm: {
        room_id: null,
        table_code: "",
        seats_count: 1,
        has_power_outlet: false,
        is_group_table: false,
        layout_x: 50, layout_y: 50, layout_width: 12, layout_height: 9, layout_rotation: 0,
        status: "available"
      },
      buildingMessage: "",
      roomMessage: "",
      tableMessage: "",
    };
  },
  computed: {
    rooms() {
      return state.rooms;
    },
    buildingRooms() {
      if (!this.selectedBuilding) {
        return [];
      }

      return this.rooms.filter((room) => room.building_id === this.selectedBuilding.id);
    },
    previewStyle() {
      return this.getTableStyle(this.tableForm);
    }
  },
  async mounted() {
    if (state.currentUser?.role !== "admin") {
      this.adminMessage = "Accesso riservato agli amministratori.";
      this.$router.push("/aule");
      return;
    }

    await this.fetchCommonData();
  },
  methods: {
    selectBuilding(building) {
      this.selectedBuilding = building;
      this.selectedRoom = null;
      this.editingBuildingId = null;
      this.editingRoomId = null;
      this.roomForm.building_id = building.id;
      this.roomMessage = "";
    },
    editBuilding(building) {
      this.editingBuildingId = building.id;
      this.buildingForm = {
        name: building.name,
        code: building.code,
        address: building.address,
        campus_area: building.campus_area || "",
        image_url: building.image_url || "",
        latitude: building.latitude,
        longitude: building.longitude,
        weekday_hours: building.weekday_hours || "",
        weekend_hours: building.weekend_hours || "",
        services_text: building.services ? building.services.join(", ") : "",
        opening_time: building.opening_time || "",
        closing_time: building.closing_time || "",
        status: building.status || "open"
      };
      // Scorrimento in alto simulato
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    cancelBuildingEdit() {
      this.editingBuildingId = null;
      this.buildingForm = this.getEmptyBuildingForm();
    },
    goBackToBuildings() {
      this.selectedBuilding = null;
      this.selectedRoom = null;
      this.editingBuildingId = null;
      this.editingRoomId = null;
      this.editingTableId = null;
      this.currentRoomTables = [];
    },
    async fetchCommonData() {
      this.adminMessage = "";
      try {
        const [buildingsResponse] = await Promise.all([
          fetch(this.apiUrl("/api/buildings")),
          apiService.loadRooms({ background: true })
        ]);

        if (!buildingsResponse.ok) {
          throw new Error("Edifici non disponibili.");
        }

        this.buildings = await buildingsResponse.json();

        if (this.selectedBuilding) {
          this.selectedBuilding = this.buildings.find((building) => building.id === this.selectedBuilding.id) || null;
        }
      } catch (error) {
        console.error("Admin data load failed:", error);
        this.adminMessage = error.message || "Dashboard admin non disponibile.";
      }
    },
    async loadRoomTables() {
      if (!this.selectedRoom?.id) {
        this.currentRoomTables = [];
        return;
      }

      const room = await apiService.loadRoomDetail(this.selectedRoom.id);
      this.currentRoomTables = room.tables || [];
    },
    async selectRoom(room) {
      this.selectedRoom = room;
      this.editingRoomId = null;
      this.editingTableId = null;
      this.tableForm.room_id = room.id;
      this.tableMessage = "";
      await this.loadRoomTables();
    },
    editRoom(room) {
      this.editingRoomId = room.id;
      this.roomForm = {
        building_id: room.building_id,
        name: room.name,
        room_code: room.room_code,
        floor_label: room.floor, // backend keys `floor_label` come `floor` nell'oggetto
        description: room.description || "",
        status: room.status || "open"
      };
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    cancelRoomEdit() {
      this.editingRoomId = null;
      this.roomForm = this.getEmptyRoomForm(this.selectedBuilding.id);
    },
    editTable(table) {
      this.editingTableId = table.id;
      this.tableForm = {
        room_id: table.room_id,
        table_code: table.table_code,
        seats_count: table.seats_count,
        has_power_outlet: Boolean(table.has_power_outlet),
        is_group_table: Boolean(table.is_group_table),
        layout_x: Number(table.layout_x),
        layout_y: Number(table.layout_y),
        layout_width: Number(table.layout_width),
        layout_height: Number(table.layout_height),
        layout_rotation: Number(table.layout_rotation),
        status: table.status || "available"
      };
    },
    cancelTableEdit() {
      this.editingTableId = null;
      this.tableForm = { 
        room_id: this.selectedRoom?.id || null, 
        table_code: "", 
        seats_count: 1, 
        has_power_outlet: false, 
        is_group_table: false, 
        layout_x: 50, layout_y: 50, layout_width: 12, layout_height: 9, layout_rotation: 0,
        status: "available"
      };
    },
    goBackToBuilding() {
      this.editingRoomId = null;
      this.editingTableId = null;
      this.currentRoomTables = [];
      this.cancelTableEdit();
      this.selectedRoom = null;
    },
    async submitBuilding() {
      this.isLoading = true;
      try {
        // Gestione servizi come array
        const services = this.buildingForm.services_text.split(",").map(s => s.trim()).filter(s => s);

        const payload = {
          ...this.buildingForm,
          services
        };
        if (!this.editingBuildingId) {
          delete payload.status;
        }

        const url = this.editingBuildingId 
          ? this.apiUrl(`/api/buildings/${this.editingBuildingId}`) 
          : this.apiUrl("/api/buildings");
        
        const method = "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${state.authToken}`
          },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          const result = await response.json();
          this.buildingMessage = this.editingBuildingId ? "Edificio modificato!" : "Edificio creato!";
          const editedBuildingId = this.editingBuildingId;
          this.cancelBuildingEdit();
          await this.fetchCommonData();
          await apiService.loadRooms({ background: true });
          const nextBuildingId = result?.id || editedBuildingId;
          const nextBuilding = this.buildings.find((building) => building.id === nextBuildingId);
          if (nextBuilding) {
            this.selectBuilding(nextBuilding);
          }
        } else {
          this.buildingMessage = await this.getResponseErrorMessage(response);
        }
      } catch (err) {
        console.error(err);
        this.buildingMessage = "Errore salvataggio";
      } finally {
        this.isLoading = false;
      }
    },
    async submitRoom() {
      this.isLoading = true;
      try {
        const url = this.editingRoomId 
          ? this.apiUrl(`/api/rooms/${this.editingRoomId}`) 
          : this.apiUrl("/api/rooms");
        const method = "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${state.authToken}`
          },
          body: JSON.stringify(this.getRoomPayload())
        });
        if (response.ok) {
          const result = await response.json();
          this.roomMessage = this.editingRoomId ? "Aula modificata!" : "Aula creata!";
          const editedRoomId = this.editingRoomId;
          this.cancelRoomEdit();
          await apiService.loadRooms({ background: true });
          const nextRoomId = result?.id || editedRoomId;
          const nextRoom = this.buildingRooms.find((room) => room.id === nextRoomId);
          if (nextRoom) {
            await this.selectRoom(nextRoom);
          }
        } else {
          this.roomMessage = await this.getResponseErrorMessage(response);
        }
      } catch (err) {
        console.error(err);
        this.roomMessage = "Errore salvataggio";
      } finally {
        this.isLoading = false;
      }
    },
    async submitTable() {
      this.isLoading = true;
      try {
        const url = this.editingTableId 
          ? this.apiUrl(`/api/rooms/tables/${this.editingTableId}`) 
          : this.apiUrl(`/api/rooms/${this.tableForm.room_id}/tables`);
        const method = "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${state.authToken}`
          },
          body: JSON.stringify(this.getTablePayload())
        });
        if (response.ok) {
          this.tableMessage = this.editingTableId ? "Tavolo modificato!" : "Tavolo creato!";
          this.cancelTableEdit();
          await apiService.loadRooms({ background: true });
          await this.loadRoomTables();
        } else {
          this.tableMessage = await this.getResponseErrorMessage(response);
        }
      } catch (err) {
        console.error(err);
        this.tableMessage = "Errore salvataggio";
      } finally {
        this.isLoading = false;
      }
    },
    updateTableType() {
      // Aggiorna la dimensione del tavolo in base al tipo selezionato
      if (this.tableForm.is_group_table) {
        this.tableForm.seats_count = 4; // Esempio: un tavolo di gruppo ha 4 posti di default
      } else {
        this.tableForm.seats_count = 1; // Un tavolo singolo ha 1 posto
      }
    },
    getExistingTableStyle(table) {
      return this.getTableStyle(table);
    },
    getTableStyle(table) {
      return {
        left: `${Number(table.layout_x || 0)}%`,
        top: `${Number(table.layout_y || 0)}%`,
        width: `${Number(table.layout_width || 12)}%`,
        height: `${Number(table.layout_height || 9)}%`,
        transform: `rotate(${Number(table.layout_rotation || 0)}deg)`
      };
    },
    getEmptyBuildingForm() {
      return {
        name: "",
        code: "",
        address: "",
        campus_area: "",
        image_url: "",
        latitude: null,
        longitude: null,
        weekday_hours: "",
        weekend_hours: "",
        services_text: "",
        opening_time: "",
        closing_time: "",
        status: "open"
      };
    },
    getEmptyRoomForm(buildingId = null) {
      return {
        building_id: buildingId,
        name: "",
        room_code: "",
        floor_label: "",
        description: "",
        status: "open"
      };
    },
    getRoomPayload() {
      const payload = { ...this.roomForm };
      if (!this.editingRoomId) {
        delete payload.status;
      }
      return payload;
    },
    getTablePayload() {
      const payload = { ...this.tableForm };
      if (!this.editingTableId) {
        delete payload.status;
      }
      return payload;
    },
    async getResponseErrorMessage(response) {
      try {
        const data = await response.json();
        return data?.error?.message || data?.message || "Errore salvataggio";
      } catch {
        return "Errore salvataggio";
      }
    },
    apiUrl(path) {
      return `${state.apiBaseUrl.replace(/\/$/, "")}${path}`;
    }
  },
  watch: {
    selectedRoom(newRoom) {
      if (newRoom) {
        this.loadRoomTables();
      }
    },
    editingTableId(newId) {
      if (newId) {
        const table = this.currentRoomTables.find(t => t.id === newId);
        if (table) {
          this.tableForm = { 
            ...table, 
            has_power_outlet: Boolean(table.has_power_outlet), 
            is_group_table: Boolean(table.is_group_table) 
          };
        }
      } else {
        this.tableForm = { room_id: this.selectedRoom?.id || null, table_code: "", seats_count: 1, has_power_outlet: false, is_group_table: false, layout_x: 50, layout_y: 50, layout_width: 12, layout_height: 9, layout_rotation: 0, status: "available" };
      }
    }
  }
};
</script>

<style scoped>
/* ...existing styles... */
</style>
