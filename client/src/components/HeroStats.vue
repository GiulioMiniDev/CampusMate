<template>
  <section class="hero-card rounded-4 p-4 p-md-5 mb-5">
    <div class="row g-4 align-items-center">
      <div class="col-lg-7">
        <p class="text-uppercase small fw-semibold tracking mb-2">Dashboard realtime</p>
        <h1 class="display-5 fw-bold mb-3">Prenota le tue aule studio</h1>
        <p class="lead mb-0 text-body-secondary">
          Visualizza la disponibilita in tempo reale e prenota il posto perfetto per studiare.
        </p>
      </div>
      <div class="col-lg-5">
        <div class="stats-grid">
          <article class="stat-card">
            <div class="stat-value">{{ totalRooms }}</div>
            <div class="stat-label">Aule disponibili</div>
          </article>
          <article class="stat-card">
            <div class="stat-value">{{ availableSeats }}</div>
            <div class="stat-label">Posti liberi</div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: "HeroStats",
  props: {
    totalRooms: {
      type: Number,
      required: true
    },
    availableSeats: {
      type: Number,
      required: true
    }
  }
};
</script>
