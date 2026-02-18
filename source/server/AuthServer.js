// src/server/AuthServer.js
import { UsersDB } from "../db/UsersDB.js";

export const AuthServer = {
  handle(req) {
    const { method, url, body } = req;

    if (method === "POST" && url === "/auth/register") {
      const { username, password } = body || {};
      if (!username || !password) return { ok: false, status: 400, error: "Missing fields" };

      const user = UsersDB.addUser({ username, password });
      if (!user) return { ok: false, status: 409, error: "Username already exists" };

      return { ok: true, status: 201, data: { id: user.id, username: user.username } };
    }

    if (method === "POST" && url === "/auth/login") {
      const { username, password } = body || {};
      const user = UsersDB.validate(username, password);
      if (!user) return { ok: false, status: 401, error: "Invalid credentials" };

      return { ok: true, status: 200, data: { id: user.id, username: user.username } };
    }

    return { ok: false, status: 404, error: "Unknown endpoint" };
  }
};
