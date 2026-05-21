<template>
  <section class="auth-layout">
    <div class="auth-panel shadow-sm">
      <div class="auth-copy">
        <p class="text-uppercase small fw-semibold tracking mb-2">CampusMate</p>
        <h1 class="h2 fw-bold mb-3">Accedi alla dashboard</h1>
        <p class="text-body-secondary mb-0">
          Prenota le aule studio con il tuo profilo studente.
        </p>
      </div>

      <div class="auth-form">
        <div class="btn-group w-100 mb-4" role="group" aria-label="Seleziona accesso o registrazione">
          <button
            type="button"
            :class="['btn', mode === 'login' ? 'btn-primary' : 'btn-outline-primary']"
            @click="$emit('switch-mode', 'login')"
          >
            Login
          </button>
          <button
            type="button"
            :class="['btn', mode === 'register' ? 'btn-primary' : 'btn-outline-primary']"
            @click="$emit('switch-mode', 'register')"
          >
            Registrazione studente
          </button>
        </div>

        <div v-if="message" :class="['alert', messageType === 'success' ? 'alert-success' : 'alert-danger']">
          {{ message }}
        </div>

        <form v-if="mode === 'login'" @submit.prevent="$emit('login')">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input
              v-model.trim="loginForm.email"
              type="email"
              class="form-control"
              autocomplete="email"
              required
            >
          </div>

          <div class="mb-4">
            <label class="form-label">Password</label>
            <input
              v-model="loginForm.password"
              type="password"
              class="form-control"
              autocomplete="current-password"
              required
            >
          </div>

          <button type="submit" class="btn btn-primary w-100" :disabled="isSubmitting">
            {{ isSubmitting ? "Accesso..." : "Accedi" }}
          </button>
        </form>

        <form v-else @submit.prevent="$emit('register')">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Nome</label>
              <input v-model.trim="registerForm.first_name" type="text" class="form-control" autocomplete="given-name" required>
            </div>

            <div class="col-md-6">
              <label class="form-label">Cognome</label>
              <input v-model.trim="registerForm.last_name" type="text" class="form-control" autocomplete="family-name" required>
            </div>

            <div class="col-12">
              <label class="form-label">Email universitaria</label>
              <input v-model.trim="registerForm.email" type="email" class="form-control" autocomplete="email" required>
            </div>

            <div class="col-md-6">
              <label class="form-label">Password</label>
              <input v-model="registerForm.password" type="password" class="form-control" autocomplete="new-password" minlength="8" required>
            </div>

            <div class="col-md-6">
              <label class="form-label">Conferma password</label>
              <input v-model="registerForm.password_confirm" type="password" class="form-control" autocomplete="new-password" minlength="8" required>
            </div>

            <div class="col-md-6">
              <label class="form-label">Matricola</label>
              <input v-model.trim="registerForm.student_number" type="text" class="form-control">
            </div>

            <div class="col-md-6">
              <label class="form-label">Anno di studio</label>
              <input v-model.number="registerForm.year_of_study" type="number" class="form-control" min="1" max="6">
            </div>

            <div class="col-md-6">
              <label class="form-label">Corso di laurea</label>
              <input v-model.trim="registerForm.degree_course" type="text" class="form-control">
            </div>

            <div class="col-md-6">
              <label class="form-label">Telefono</label>
              <input v-model.trim="registerForm.phone" type="tel" class="form-control" autocomplete="tel">
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-100 mt-4" :disabled="isSubmitting">
            {{ isSubmitting ? "Creazione..." : "Crea account studente" }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "AuthPanel",
  props: {
    mode: {
      type: String,
      required: true
    },
    loginForm: {
      type: Object,
      required: true
    },
    registerForm: {
      type: Object,
      required: true
    },
    isSubmitting: {
      type: Boolean,
      required: true
    },
    message: {
      type: String,
      default: null
    },
    messageType: {
      type: String,
      required: true
    }
  },
  emits: ["switch-mode", "login", "register"]
};
</script>
