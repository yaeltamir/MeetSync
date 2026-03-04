// src/db/UsersDB.js — user storage in localStorage (in-memory for this demo)
const KEY = "MEETSYNC_USERS";

// Reads the user list from localStorage.
function load() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

// Writes the user list back to localStorage.
function save(users) {
  localStorage.setItem(KEY, JSON.stringify(users));
}

export const UsersDB = {
  // Finds a user by username, or returns null.
  getByUsername(username) {
    return load().find(u => u.username === username) || null;
  },

  // Creates a new user; returns null if username is already taken.
  addUser({ username, password }) {
    const users = load();
    if (users.some(u => u.username === username)) return null;
    const user = { id: crypto.randomUUID(), username, password };
    users.push(user);
    save(users);
    return user;
  },

  // Returns the user if credentials match, otherwise null.
  validate(username, password) {
    const u = this.getByUsername(username);
    if (!u) return null;
    return u.password === password ? u : null;
  },
};
