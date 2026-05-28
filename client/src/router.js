import { createRouter, createWebHistory } from "vue-router";
import AccountView from "./views/AccountView.vue";
import ReservationsView from "./views/ReservationsView.vue";
import RoomsView from "./views/RoomsView.vue";
import AdminDashboard from "./views/AdminDashboard.vue";
import ReceptionView from "./views/ReceptionView.vue";
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
      path: "/reception",
      name: "reception",
      component: ReceptionView
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/aule"
    }
  ]
});

router.beforeEach((to) => {
  if (to.path === "/prenotazioni" && ["admin", "receptionist"].includes(state.currentUser?.role)) {
    return state.currentUser.role === "receptionist" ? "/reception" : "/aule";
  }

  if (to.path === "/aule" && state.currentUser?.role === "receptionist") {
    return "/reception";
  }

  if (to.path === "/admin" && state.currentUser?.role && state.currentUser.role !== "admin") {
    return state.currentUser.role === "receptionist" ? "/reception" : "/aule";
  }

  if (to.path === "/reception" && state.currentUser?.role && state.currentUser.role !== "receptionist") {
    return "/aule";
  }
});

export default router;
