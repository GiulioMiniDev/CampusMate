import { createRouter, createWebHistory } from "vue-router";
import AccountView from "./views/AccountView.vue";
import ReservationsView from "./views/ReservationsView.vue";
import RoomsView from "./views/RoomsView.vue";
import AdminDashboard from "./views/AdminDashboard.vue";
import { state } from "./store.js";

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
      path: "/admin",
      name: "admin",
      component: AdminDashboard
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/aule"
    }
  ]
});

router.beforeEach((to) => {
  if (to.path === "/prenotazioni" && state.currentUser?.role === "admin") {
    return "/aule";
  }
});

export default router;
