<template>
  <section class="border-top pt-4 diagnostics">
    <h3 class="h5 mb-3">Diagnostica tecnica</h3>
    <div class="row g-3">
      <div class="col-lg-6">
        <div class="card bg-light">
          <div class="card-body">
            <h6 class="card-subtitle mb-3 text-body-secondary">Risposta backend</h6>
            <div v-if="health" class="small code-block">
              <div><strong>Servizio:</strong> {{ health.service }}</div>
              <div><strong>Stack:</strong> {{ health.stack.join(", ") }}</div>
              <div><strong>Timestamp:</strong> {{ health.timestamp }}</div>
            </div>
            <div v-else class="text-body-secondary">In attesa di connessione...</div>
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card bg-light">
          <div class="card-body">
            <h6 class="card-subtitle mb-3 text-body-secondary">Messaggi WebSocket</h6>
            <div v-if="socketMessages.length" class="small code-block">
              <div v-for="(msg, idx) in socketMessages" :key="idx" class="mb-2">
                <code>{{ msg }}</code>
              </div>
            </div>
            <div v-else class="text-body-secondary">Nessun messaggio ricevuto</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "DiagnosticsPanel",
  props: {
    health: {
      type: Object,
      default: null
    },
    socketMessages: {
      type: Array,
      required: true
    }
  }
};
</script>
