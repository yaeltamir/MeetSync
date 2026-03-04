// src/client/router.js — hash-based SPA routing
import { renderLogin } from "./views/loginView.js";
import { renderRegister } from "./views/registerView.js";
import { renderMeetings } from "./views/meetingsView.js";
import { State } from "./state.js";

// Initialises the hash-based router, listens for hashchange, and renders the matching view.
export function startRouter(appEl) {
  // Reads location.hash and mounts the matching view; redirects unauthenticated users to login.
  function route() {
    const hash = window.location.hash || "#/login";
    const path = hash.replace("#", "");

    if (path === "/login") return renderLogin(appEl);
    if (path === "/register") return renderRegister(appEl);

    if (path === "/meetings") {
      if (!State.getActiveUser()) {
        window.location.hash = "#/login";
        return;
      }
      return renderMeetings(appEl);
    }
  }

  window.addEventListener("hashchange", route);
  route();
}
