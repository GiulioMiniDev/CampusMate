<template>
  <section class="cm-panel account-view p-4">
    <div class="px-2">
      <p class="text-uppercase small fw-semibold tracking mb-2">Account</p>
      <h1 class="h3 mb-2">Impostazioni profilo</h1>
      <p class="text-body-secondary mb-4">
        Gestisci i tuoi dati personali e la sicurezza dell'account.
      </p>

      <form @submit.prevent="saveProfile" class="cm-form mb-4">
        <div v-if="profileMessage" :class="['cm-alert', `cm-alert-${profileMessageType === 'error' ? 'danger' : 'success'}`]">
          {{ profileMessage }}
        </div>

        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label for="profile_first_name" class="cm-label form-label">Nome</label>
            <input id="profile_first_name" type="text" class="form-control cm-field" v-model="form.first_name" required />
          </div>
          <div class="col-md-6">
            <label for="profile_last_name" class="cm-label form-label">Cognome</label>
            <input id="profile_last_name" type="text" class="form-control cm-field" v-model="form.last_name" required />
          </div>
        </div>

        <div class="mb-3">
          <label for="profile_email" class="cm-label form-label">Email</label>
          <input id="profile_email" type="email" class="form-control cm-field" v-model="form.email" required autocomplete="email" />
        </div>

        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label for="profile_student_number" class="cm-label form-label">Matricola</label>
            <input id="profile_student_number" type="text" class="form-control cm-field" v-model="form.student_number" />
          </div>
          <div class="col-md-6">
            <label for="profile_degree_course" class="cm-label form-label">Corso di Laurea</label>
            <input id="profile_degree_course" type="text" class="form-control cm-field" v-model="form.degree_course" />
          </div>
        </div>

        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label for="profile_year_of_study" class="cm-label form-label">Anno di Studio (1-6)</label>
            <input id="profile_year_of_study" type="number" class="form-control cm-field" min="1" max="6" v-model="form.year_of_study" />
          </div>
          <div class="col-md-6">
            <label for="profile_phone" class="cm-label form-label">Telefono</label>
            <input id="profile_phone" type="tel" class="form-control cm-field" v-model="form.phone" />
          </div>
        </div>

        <hr class="my-4" />

        <h3 class="h5 mb-3">Sicurezza</h3>
        <p class="text-body-secondary small mb-3">Lascia vuoto se non vuoi cambiare la password.</p>

        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <label for="profile_password" class="cm-label form-label">Nuova Password</label>
            <input id="profile_password" type="password" class="form-control cm-field" v-model="form.password" autocomplete="new-password" />
          </div>
          <div class="col-md-6">
            <label for="profile_password_confirm" class="cm-label form-label">Conferma Nuova Password</label>
            <input id="profile_password_confirm" type="password" class="form-control cm-field" v-model="form.password_confirm" autocomplete="new-password" />
          </div>
        </div>

        <div class="d-flex gap-2">
          <button type="submit" class="cm-button cm-button-primary" :disabled="profileSubmitting">
            <span v-if="profileSubmitting">Salvataggio...</span>
            <span v-else>Salva Modifiche</span>
          </button>
        </div>
      </form>

      <hr class="my-4" />

      <button type="button" class="cm-button cm-button-secondary account-logout" @click="$emit('logout')">
        <LogOut class="account-logout-icon" aria-hidden="true" />
        <span>Esci dall'account</span>
      </button>
    </div>
  </section>
</template>

<script>
import { LogOut } from "@lucide/vue";
import { state, mutations } from "../store.js";
import { apiService } from "../api.js";

export default {
  name: "AccountView",
  components: {
    LogOut
  },
  emits: ["logout"],
  computed: {
    currentUser() { return state.currentUser; },
    form() { return state.updateProfileForm; },
    profileMessage() { return state.profileMessage; },
    profileMessageType() { return state.profileMessageType; },
    profileSubmitting() { return state.profileSubmitting; }
  },
  mounted() {
    this.populateForm();
  },
  watch: {
    currentUser(newVal) {
      if (newVal) {
        this.populateForm();
      }
    }
  },
  methods: {
    populateForm() {
      if (this.currentUser) {
        state.updateProfileForm.first_name = this.currentUser.first_name || "";
        state.updateProfileForm.last_name = this.currentUser.last_name || "";
        state.updateProfileForm.email = this.currentUser.email || "";
        state.updateProfileForm.student_number = this.currentUser.student_number || "";
        state.updateProfileForm.degree_course = this.currentUser.degree_course || "";
        state.updateProfileForm.year_of_study = this.currentUser.year_of_study || "";
        state.updateProfileForm.phone = this.currentUser.phone || "";
        state.updateProfileForm.password = "";
        state.updateProfileForm.password_confirm = "";
        mutations.setProfileMessage(null);
      }
    },
    async saveProfile() {
      await apiService.updateProfile();
    }
  }
};
</script>
