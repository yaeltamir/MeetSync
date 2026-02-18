// src/server/MeetingsServer.js
import { MeetingsDB } from "../db/MeetingsDB.js";

function parseUrl(url) {
  // supports: /meetings , /meetings/{id}
  const parts = url.split("/").filter(Boolean);
  return { resource: parts[0] || "", id: parts[1] || null };
}

function isValidMeeting(m) {
  if (!m) return false;
  if (!m.title || !m.date || !m.time) return false;
  return true;
}

export const MeetingsServer = {
  handle(req) {
    const { method, url, body } = req;

    // simple auth: require userId in body.meta (or body.userId)
    const userId = body?.meta?.userId || body?.userId;
    if (!userId) return { ok: false, status: 401, error: "Unauthorized (missing userId)" };

    const { resource, id } = parseUrl(url);
    if (resource !== "meetings") return { ok: false, status: 404, error: "Unknown resource" };

    // GET /meetings
    if (method === "GET" && !id) {
      const items = MeetingsDB.getAllByUser(userId);
      return { ok: true, status: 200, data: items };
    }

    // GET /meetings/{id}
    if (method === "GET" && id) {
      const item = MeetingsDB.getById(userId, id);
      if (!item) return { ok: false, status: 404, error: "Meeting not found" };
      return { ok: true, status: 200, data: item };
    }

    // POST /meetings
    if (method === "POST" && !id) {
      const meeting = body?.meeting;
      if (!isValidMeeting(meeting)) return { ok: false, status: 400, error: "Missing title/date/time" };
      const created = MeetingsDB.add(userId, meeting);
      return { ok: true, status: 201, data: created };
    }

    // PUT /meetings/{id}
    if (method === "PUT" && id) {
      const patch = body?.meeting;
      if (!isValidMeeting(patch)) return { ok: false, status: 400, error: "Missing title/date/time" };
      const updated = MeetingsDB.update(userId, id, patch);
      if (!updated) return { ok: false, status: 404, error: "Meeting not found" };
      return { ok: true, status: 200, data: updated };
    }

    // DELETE /meetings/{id}
    if (method === "DELETE" && id) {
      const ok = MeetingsDB.remove(userId, id);
      if (!ok) return { ok: false, status: 404, error: "Meeting not found" };
      return { ok: true, status: 200, data: { deleted: true } };
    }

    return { ok: false, status: 405, error: "Method not allowed" };
  }
};
