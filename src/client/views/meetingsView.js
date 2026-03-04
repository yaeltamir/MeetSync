// src/client/views/meetingsView.js — meetings list, search, CRUD modal, logout
import { sendWithRetry, ADDR_MEETINGS } from "../api.js";
import { State } from "../state.js";

// Renders the meetings view: list, search, new/edit dialog, and wires all API calls with retry.
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

  // Payload meta sent with every meetings API request for auth.
  function apiMeta() {
    return { meta: { userId: user.id } };
  }

  // Toggles loading state and disables relevant buttons; optional message in top msg area.
  function setBusy(isBusy, topText = "") {
  busy=isBusy;
  searchInput.disabled=isBusy;
  appEl.querySelectorAll("button").forEach(b=>{
    if(b.id==="cancelBtn") b.disabled=false;
    else if(b.id==="logoutBtn"||b.id==="newBtn"||b.id==="saveBtn"||b.textContent==="Edit"||b.textContent==="Delete") b.disabled=isBusy;
  });
  if (topText) msg.textContent = topText;
  }

  // Filters meetings by search query and re-renders the list (sorted by date+time).
  function renderList() {
    const q = (searchInput.value || "").trim().toLowerCase();

    const filtered = allMeetings
      .filter((m) => m.title.toLowerCase().includes(q))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    list.replaceChildren(...filtered.map((m) => meetingRow(m)));
  }

  // Builds one <li> for a meeting with title, meta, Edit and Delete buttons.
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

  // Opens the modal for creating a new meeting (empty form).
  function openDialogNew() {
    if (busy) return;
    dialogTitle.textContent = "New Meeting";
    dialogMsg.textContent = "";
    form.reset();
    form.elements.id.value = "";
    dialog.showModal();
  }

  // Opens the modal for editing an existing meeting (form pre-filled).
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

  // Closes the meeting modal.
  function closeDialog() {
    dialog.close();
  }

  // Fetches all meetings for the current user (with retry) and refreshes the list.
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

  // Creates or updates a meeting (POST if no id, PUT if id); uses retry, then reloads list.
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

  // Deletes a meeting by id (with retry) and reloads the list.
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
