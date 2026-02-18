import { fajax, ADDR_AUTH, parseResponseText } from "../api.js";

export function renderRegister(appEl) {
  const tpl = document.getElementById("tpl-register");
  appEl.replaceChildren(tpl.content.cloneNode(true));

  const form = appEl.querySelector("#registerForm");
  const msg = appEl.querySelector("#registerMsg");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    msg.textContent = "";

    const fd = new FormData(form);
    const username = String(fd.get("username") || "").trim();
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");

    if (password !== confirm) {
      msg.textContent = "Passwords do not match.";
      return;
    }

    msg.textContent = "Sending...";

    const xhr = fajax();
    xhr.onload = () => {
      msg.textContent = "Account created. Redirecting to login...";
      window.location.hash = "#/login";
    };
    xhr.onerror = () => {
      const res = parseResponseText(xhr);
      msg.textContent = res.error || "Register failed";
    };

    xhr.open("POST", "/auth/register", ADDR_AUTH);
    xhr.send({ username, password });
  });
}
