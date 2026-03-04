// src/client/state.js — in-memory + localStorage session (current user)
const KEY = "MEETSYNC_ACTIVE_USER";

export const State = {
  // Returns the currently logged-in user from localStorage, or null.
  getActiveUser() {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  },

  // Persists the authenticated user to localStorage.
  setActiveUser(user) {
    localStorage.setItem(KEY, JSON.stringify(user));
  },

  // Removes the active user from localStorage, ending the session.
  clearActiveUser() {
    localStorage.removeItem(KEY);
  }
};
