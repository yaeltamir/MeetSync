// src/client/views/meetingsView.js
import { sendWithRetry, ADDR_MEETINGS } from "../api.js";
import { State } from "../state.js";

export function renderMeetings(appEl) {
  const tpl = document.getElementById("tpl-meetings");
  appEl.replaceChildren(tpl.content.cloneNode(true));

  const user = State.getActiveUser();
  if (!user) {
    window.location.hash = "#/login";
    return;
  }

  const msg = appEl.querySelector("#meetingsMsg");
  const list = appEl.querySelector("#meetingsList");
  const searchInput = appEl.querySelector("#searchInput");
  const newBtn = appEl.querySelector("#newBtn");
  const logoutBtn = appEl.querySelector("#logoutBtn");

  const dialog = appEl.querySelector("#meetingDialog");
  const form = appEl.querySelector("#meetingForm");
  const dialogTitle = appEl.querySelector("#dialogTitle");
  const dialogMsg = appEl.querySelector("#dialogMsg");
  const cancelBtn = appEl.querySelector("#cancelBtn");
  const saveBtn = appEl.querySelector("#saveBtn");

  let allMeetings = [];
  let busy = false;

  function apiMeta() {
    return { meta: { userId: user.id } };
  }

  function setBusy(isBusy, topText = "") {
    busy = isBusy;

    newBtn.disabled = isBusy;
    logoutBtn.disabled = isBusy;
    searchInput.disabled = isBusy;

    if (saveBtn) saveBtn.disabled = isBusy;
    cancelBtn.disabled = false; // allow cancel even when busy (optional)

    // disable row buttons (Edit/Delete) while busy
    appEl.querySelectorAll("button").forEach((b) => {
      if (b.id === "cancelBtn") return;
      if (b.id === "logoutBtn" || b.id === "newBtn" || b.id === "saveBtn") return; // already handled
      // Only disable buttons that are clearly actions (Edit/Delete)
      if (b.textContent === "Edit" || b.textContent === "Delete") b.disabled = isBusy;
    });

    if (topText) msg.textContent = topText;
  }

  function renderList() {
    const q = (searchInput.value || "").trim().toLowerCase();

    const filtered = allMeetings
      .filter((m) => m.title.toLowerCase().includes(q))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    list.replaceChildren(...filtered.map((m) => meetingRow(m)));
  }

  function meetingRow(m) {
    const li = document.createElement("li");

    const title = document.createElement("strong");
    title.textContent = m.title;

    const meta = document.createElement("span");
    meta.textContent = ` — ${m.date} ${m.time}${m.location ? " @ " + m.location : ""}`;

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.disabled = busy;
    editBtn.addEventListener("click", () => openDialogEdit(m));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "Delete";
    delBtn.disabled = busy;
    delBtn.addEventListener("click", () => deleteMeeting(m.id));

    li.append(title, meta, document.createTextNode(" "), editBtn, document.createTextNode(" "), delBtn);
    return li;
  }

  function openDialogNew() {
    if (busy) return;
    dialogTitle.textContent = "New Meeting";
    dialogMsg.textContent = "";
    form.reset();
    form.elements.id.value = "";
    dialog.showModal();
  }

  function openDialogEdit(m) {
    if (busy) return;
    dialogTitle.textContent = "Edit Meeting";
    dialogMsg.textContent = "";
    form.elements.id.value = m.id;
    form.elements.title.value = m.title;
    form.elements.date.value = m.date;
    form.elements.time.value = m.time;
    form.elements.location.value = m.location || "";
    form.elements.notes.value = m.notes || "";
    dialog.showModal();
  }

  function closeDialog() {
    dialog.close();
  }

  function loadMeetings() {
    setBusy(true, "Loading...");

    sendWithRetry(
      {
        method: "GET",
        url: "/meetings",
        to: ADDR_MEETINGS,
        body: apiMeta(),
        retries: 2,
      },
      {
        onAttempt: (left) => {
          if (left < 2) msg.textContent = `Network issue… retrying (${2 - left}/2)`;
        },
        onOk: (res) => {
          allMeetings = res.data || [];
          msg.textContent = "";
          setBusy(false);
          renderList();
        },
        onFail: (res) => {
          msg.textContent = res.error || "Failed to load meetings";
          setBusy(false);
        },
      }
    );
  }

  function upsertMeeting(meeting) {
    if (busy) return;

    const id = form.elements.id.value;
    const method = id ? "PUT" : "POST";
    const url = id ? `/meetings/${id}` : "/meetings";

    dialogMsg.textContent = "Saving...";
    setBusy(true);

    sendWithRetry(
      {
        method,
        url,
        to: ADDR_MEETINGS,
        body: { ...apiMeta(), meeting },
        retries: 2,
      },
      {
        onAttempt: (left) => {
          if (left < 2) dialogMsg.textContent = `Network issue… retrying (${2 - left}/2)`;
        },
        onOk: () => {
          dialogMsg.textContent = "";
          setBusy(false);
          closeDialog();
          loadMeetings();
        },
        onFail: (res) => {
          dialogMsg.textContent = res.error || "Save failed";
          setBusy(false);
        },
      }
    );
  }

  function deleteMeeting(id) {
    if (busy) return;
    setBusy(true, "Deleting...");

    sendWithRetry(
      {
        method: "DELETE",
        url: `/meetings/${id}`,
        to: ADDR_MEETINGS,
        body: apiMeta(),
        retries: 2,
      },
      {
        onAttempt: (left) => {
          if (left < 2) msg.textContent = `Network issue… retrying (${2 - left}/2)`;
        },
        onOk: () => {
          msg.textContent = "";
          setBusy(false);
          loadMeetings();
        },
        onFail: (res) => {
          msg.textContent = res.error || "Delete failed";
          setBusy(false);
        },
      }
    );
  }

  // Events
  searchInput.addEventListener("input", () => {
    if (!busy) renderList();
  });

  newBtn.addEventListener("click", openDialogNew);

  cancelBtn.addEventListener("click", () => {
    // allow cancel anytime
    closeDialog();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (busy) return;

    const meeting = {
      title: String(form.elements.title.value || "").trim(),
      date: String(form.elements.date.value || ""),
      time: String(form.elements.time.value || ""),
      location: String(form.elements.location.value || "").trim(),
      notes: String(form.elements.notes.value || "").trim(),
    };

    // minimal validation client-side
    if (!meeting.title || !meeting.date || !meeting.time) {
      dialogMsg.textContent = "Please fill title, date and time.";
      return;
    }

    upsertMeeting(meeting);
  });

  logoutBtn.addEventListener("click", () => {
    if (busy) return;
    State.clearActiveUser();
    window.location.hash = "#/login";
  });

  // init
  loadMeetings();
}
