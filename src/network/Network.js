// src/network/Network.js — simulated network: delay + random drop, routes by address

// Simulates an unreliable network with random delays and a configurable packet drop rate.
export class Network {
  // Clamps drop rate to [0.1, 0.5] and stores config.
  constructor({ dropRate = 0.2, minDelayMs = 1000, maxDelayMs = 3000 } = {}) {
    if (dropRate < 0.1) dropRate = 0.1;
    if (dropRate > 0.5) dropRate = 0.5;

    this.dropRate = dropRate;
    this.minDelayMs = minDelayMs;
    this.maxDelayMs = maxDelayMs;
    this.routes = new Map();
  }

  // Binds a handler function to a named address.
  register(address, handlerFn) {
    this.routes.set(address, handlerFn);
  }

  // Dispatches a request after a random delay; drops it (503) at dropRate probability.
  send(request, callback) {
    const delay = this.minDelayMs + Math.random() * (this.maxDelayMs - this.minDelayMs);

    console.log("[Network] send to:", request.to, "delay(ms):", Math.round(delay));

    setTimeout(() => {
      if (Math.random() < this.dropRate) {
        console.warn("[Network] DROPPED request to:", request.to);
        callback({ ok: false, status: 503, error: "Network dropped the request" });
        return;
      }

      const handler = this.routes.get(request.to);
      if (!handler) {
        console.error("[Network] NO ROUTE for:", request.to);
        callback({ ok: false, status: 404, error: `No route for ${request.to}` });
        return;
      }

      try {
        const response = handler(request);
        console.log("[Network] response from:", request.to, "status:", response?.status);
        callback(response);
      } catch (err) {
        console.error("[Network] SERVER ERROR:", err);
        callback({ ok: false, status: 500, error: err?.message || "Server error" });
      }
    }, delay);
  }
}
