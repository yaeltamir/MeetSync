// src/db/MeetingsDB.js — meetings storage in localStorage, keyed by userId
const KEY = "MEETSYNC_MEETINGS";

// Reads the meetings list from localStorage.
function load() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

// Writes the meetings list back to localStorage.
function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export const MeetingsDB = {
  // Returns all meetings belonging to the given user.
  getAllByUser(userId) {
    return load().filter(m => m.userId === userId);
  },

  // Returns a single meeting by id scoped to the given user, or null.
  getById(userId, id) {
    return load().find(m => m.userId === userId && m.id === id) || null;
  },

  // Creates a new meeting with a generated id and persists it.
  add(userId, meeting) {
    const items = load();
    const newItem = {
      id: crypto.randomUUID(),
      userId,
      title: meeting.title,
      date: meeting.date,     // YYYY-MM-DD
      time: meeting.time,     // HH:MM
      location: meeting.location || "",
      notes: meeting.notes || "",
      createdAt: Date.now(),
    };
    items.push(newItem);
    save(items);
    return newItem;
  },

  // Merges patch fields into an existing meeting and updates updatedAt.
  update(userId, id, patch) {
    const items = load();
    const idx = items.findIndex(m => m.userId === userId && m.id === id);
    if (idx === -1) return null;

    items[idx] = {
      ...items[idx],
      title: patch.title ?? items[idx].title,
      date: patch.date ?? items[idx].date,
      time: patch.time ?? items[idx].time,
      location: patch.location ?? items[idx].location,
      notes: patch.notes ?? items[idx].notes,
      updatedAt: Date.now(),
    };
    save(items);
    return items[idx];
  },

  // Deletes a meeting by id for the given user; returns false if not found.
  remove(userId, id) {
    const items = load();
    const before = items.length;
    const afterItems = items.filter(m => !(m.userId === userId && m.id === id));
    if (afterItems.length === before) return false;
    save(afterItems);
    return true;
  },
};
