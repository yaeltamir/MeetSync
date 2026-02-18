import { fajax, ADDR_AUTH, parseResponseText } from "../api.js";
import { State } from "../state.js";

export function renderLogin(appEl) {
  const tpl = document.getElementById("tpl-login");
  appEl.replaceChildren(tpl.content.cloneNode(true));

  const form = appEl.querySelector("#loginForm");
  const msg = appEl.querySelector("#loginMsg");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.textContent = "Sending...";

    const fd = new FormData(form);
    const username = String(fd.get("username") || "").trim();
    const password = String(fd.get("password") || "");

    const xhr = fajax();
    xhr.onload = () => {
      const res = parseResponseText(xhr);
      State.setActiveUser(res.data);
      window.location.hash = "#/meetings";
    };
    xhr.onerror = () => {
      const res = parseResponseText(xhr);
      msg.textContent = res.error || "Login failed";
    };

    xhr.open("POST", "/auth/login", ADDR_AUTH);
    xhr.send({ username, password });
  });
}
