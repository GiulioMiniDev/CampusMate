<template>
  <section class="hero-card cm-panel mb-4">
    <div class="hero-card-inner">
      <div class="hero-copy">
        <p class="text-uppercase fw-semibold tracking mb-1">Dashboard realtime</p>
        <h1 class="fw-bold mb-0">Aule studio</h1>
      </div>
      <div class="stats-grid">
        <article class="stat-card cm-card">
          <div class="stat-value">{{ totalRooms }}</div>
          <div class="stat-label">Aule</div>
        </article>
        <article class="stat-card cm-card">
          <div class="stat-value">{{ availableSeats }}</div>
          <div class="stat-label">Posti</div>
        </article>
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
