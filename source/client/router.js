// src/client/router.js
import { renderLogin } from "./views/loginView.js";
import { renderRegister } from "./views/registerView.js";
import { renderMeetings } from "./views/meetingsView.js";
import { State } from "./state.js";

export function startRouter(appEl) {
  function route() {
    const hash = window.location.hash || "#/login";
    const path = hash.replace("#", "");

    if (path === "/login") return renderLogin(appEl);
    if (path === "/register") return renderRegister(appEl);
    if (path === "/meetings") return renderMeetings(appEl);

    // fallback
    if (path === "/meetings")
    {
        if (!State.getActiveUser())
        {
            window.location.hash = "#/login";
            return;
        }
        return renderMeetings(appEl);
    }
  }

  window.addEventListener("hashchange", route);
  route();
}
