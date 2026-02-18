// src/db/UsersDB.js
const KEY = "MEETSYNC_USERS";

function load() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}
function save(users) {
  localStorage.setItem(KEY, JSON.stringify(users));
}

export const UsersDB = {
  getByUsername(username) {
    return load().find(u => u.username === username) || null;
  },
  addUser({ username, password }) {
    const users = load();
    if (users.some(u => u.username === username)) return null;
    const user = { id: crypto.randomUUID(), username, password };
    users.push(user);
    save(users);
    return user;
  },
  validate(username, password) {
    const u = this.getByUsername(username);
    if (!u) return null;
    return u.password === password ? u : null;
  },
};
