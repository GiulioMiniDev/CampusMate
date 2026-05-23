<template>
  <section class="cm-panel account-empty">
    <div>
      <p class="text-uppercase small fw-semibold tracking mb-2">Account</p>
      <h1 class="h3 mb-2">Impostazioni profilo</h1>
      <p class="text-body-secondary mb-4">
        Questa sezione e pronta per preferenze, dati account e sicurezza.
      </p>

      <div v-if="currentUser" class="account-summary">
        <div>
          <span class="cm-section-kicker">Utente attuale</span>
          <strong>{{ currentUser.first_name }} {{ currentUser.last_name }}</strong>
          <small>{{ currentUser.email }}</small>
        </div>
      </div>

      <button type="button" class="cm-button cm-button-secondary account-logout" @click="$emit('logout')">
        <LogOut class="account-logout-icon" aria-hidden="true" />
        <span>Esci dall'account</span>
      </button>
    </div>
  </section>
</template>

<script>
import { LogOut } from "@lucide/vue";
import { state } from "../store.js";

export default {
  name: "AccountView",
  components: {
    LogOut
  },
  emits: ["logout"],
  computed: {
    currentUser() { return state.currentUser; }
  }
};
</script>
