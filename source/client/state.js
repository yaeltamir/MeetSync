// src/client/state.js
const KEY = "MEETSYNC_ACTIVE_USER";

export const State = {
  getActiveUser() {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  },
  setActiveUser(user) {
    localStorage.setItem(KEY, JSON.stringify(user));
  },
  clearActiveUser() {
    localStorage.removeItem(KEY);
  }
};
