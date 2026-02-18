// src/network/Network.js
export class Network {
  constructor({ dropRate = 0.2, minDelayMs = 1000, maxDelayMs = 3000 } = {}) {
    this.dropRate = dropRate;
    this.minDelayMs = minDelayMs;
    this.maxDelayMs = maxDelayMs;
    this.routes = new Map(); // address -> handler(request) => response
  }

  register(address, handlerFn) {
    this.routes.set(address, handlerFn);
  }

  send(request, callback) {
    const delay = this.minDelayMs + Math.random() * (this.maxDelayMs - this.minDelayMs);

    setTimeout(() => {
      // drop simulation (10%-50% required; you can tune)
      if (Math.random() < this.dropRate) {
        callback({
          ok: false,
          status: 503,
          error: "Network dropped the request",
        });
        return;
      }

      const handler = this.routes.get(request.to);
      if (!handler) {
        callback({ ok: false, status: 404, error: `No route for ${request.to}` });
        return;
      }

      try {
        const response = handler(request);
        callback(response);
      } catch (err) {
        callback({ ok: false, status: 500, error: err?.message || "Server error" });
      }
    }, delay);
  }
}
