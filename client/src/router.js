import { createRouter, createWebHistory } from "vue-router";
import AccountView from "./views/AccountView.vue";
import ReservationsView from "./views/ReservationsView.vue";
import RoomsView from "./views/RoomsView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/aule"
    },
    {
      path: "/aule",
      name: "rooms",
      component: RoomsView
    },
    {
      path: "/prenotazioni",
      name: "reservations",
      component: ReservationsView
    },
    {
      path: "/account",
      name: "account",
      component: AccountView
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/aule"
    }
  ]
});

export default router;
